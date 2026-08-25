import * as v from 'valibot';

const DEFAULT_CACHE_TTL_SECONDS = 60 * 60;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRY_DELAY_MS = 2_000;
const RETRY_DELAYS_MS = [250, 750];
const CACHE_KEY_ORIGIN = 'https://openalex-cache.whofundsthis.invalid';

type OpenAlexClientErrorCode =
	| 'aborted'
	| 'http_error'
	| 'invalid_json'
	| 'invalid_response'
	| 'network_error'
	| 'timeout'
	| 'transient_failure';

type OpenAlexResponseCache = {
	match: (request: string) => Promise<Response | undefined>;
	put: (request: string, response: Response) => Promise<void>;
};

class OpenAlexClientError extends Error {
	readonly attempts?: number;
	readonly code: OpenAlexClientErrorCode;
	readonly status?: number;

	constructor({
		message,
		code,
		status,
		attempts,
		cause
	}: {
		message: string;
		code: OpenAlexClientErrorCode;
		status?: number;
		attempts?: number;
		cause?: unknown;
	}) {
		super(message, { cause });
		this.name = 'OpenAlexClientError';
		this.code = code;
		this.status = status;
		this.attempts = attempts;
	}
}

type OpenAlexRequestClientOptions = {
	apiKey?: string;
	cache?: object;
	cacheTtlSeconds?: number;
	fetch?: typeof globalThis.fetch;
	maxAttempts?: number;
	timeoutMs?: number;
	waitUntil?: (promise: Promise<unknown>) => void;
};

type RequestJsonOptions<T> = {
	schema: v.GenericSchema<unknown, T>;
	signal?: AbortSignal;
	url: URL;
};

type RequestAttemptResult =
	{ response: Response; attempts: number } | { error: OpenAlexClientError; attempts: number };

const isOpenAlexResponseCache = (value: object | undefined): value is OpenAlexResponseCache =>
	Boolean(
		value &&
		'match' in value &&
		typeof value.match === 'function' &&
		'put' in value &&
		typeof value.put === 'function'
	);

const assertPositiveInteger = ({ value, name }: { value: number; name: string }) => {
	if (!Number.isInteger(value) || value < 1) {
		throw new RangeError(`${name} must be a positive integer.`);
	}
};

const toHex = (bytes: ArrayBuffer) =>
	Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');

const createCacheKey = async (url: URL) => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url.toString()));
	return `${CACHE_KEY_ORIGIN}/v1/${toHex(digest)}`;
};

const parseRetryAfter = (response: Response) => {
	const value = response.headers.get('retry-after');

	if (!value) return null;

	const seconds = Number(value);
	const delay = Number.isFinite(seconds) ? seconds * 1_000 : Date.parse(value) - Date.now();

	return Number.isFinite(delay) ? Math.max(0, Math.min(delay, MAX_RETRY_DELAY_MS)) : null;
};

const getRetryDelay = ({ response, attempt }: { response?: Response; attempt: number }) =>
	(response && parseRetryAfter(response)) ?? RETRY_DELAYS_MS[attempt - 1] ?? MAX_RETRY_DELAY_MS;

const waitForRetry = async ({ delayMs, signal }: { delayMs: number; signal?: AbortSignal }) => {
	if (signal?.aborted) {
		throw new OpenAlexClientError({
			message: 'OpenAlex request was aborted.',
			code: 'aborted',
			cause: signal.reason
		});
	}

	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			signal?.removeEventListener('abort', handleAbort);
			resolve();
		}, delayMs);
		const handleAbort = () => {
			clearTimeout(timeout);
			reject(
				new OpenAlexClientError({
					message: 'OpenAlex request was aborted.',
					code: 'aborted',
					cause: signal?.reason
				})
			);
		};

		signal?.addEventListener('abort', handleAbort, { once: true });
	});
};

const fetchAttempt = async ({
	url,
	fetchRequest,
	signal,
	timeoutMs,
	attempt
}: {
	url: URL;
	fetchRequest: typeof globalThis.fetch;
	signal?: AbortSignal;
	timeoutMs: number;
	attempt: number;
}): Promise<RequestAttemptResult> => {
	if (signal?.aborted) {
		return {
			attempts: attempt,
			error: new OpenAlexClientError({
				message: 'OpenAlex request was aborted.',
				code: 'aborted',
				attempts: attempt,
				cause: signal.reason
			})
		};
	}

	const controller = new AbortController();
	let timedOut = false;
	const handleAbort = () => controller.abort(signal?.reason);
	const timeout = setTimeout(() => {
		timedOut = true;
		controller.abort(new Error(`OpenAlex request timed out after ${timeoutMs}ms.`));
	}, timeoutMs);

	signal?.addEventListener('abort', handleAbort, { once: true });

	try {
		const response = await fetchRequest(url, {
			headers: { accept: 'application/json' },
			signal: controller.signal
		});
		return { response, attempts: attempt };
	} catch (cause) {
		if (signal?.aborted) {
			return {
				attempts: attempt,
				error: new OpenAlexClientError({
					message: 'OpenAlex request was aborted.',
					code: 'aborted',
					attempts: attempt,
					cause: signal.reason ?? cause
				})
			};
		}

		return {
			attempts: attempt,
			error: new OpenAlexClientError({
				message: timedOut
					? `OpenAlex request timed out after ${timeoutMs}ms.`
					: 'OpenAlex request could not be completed.',
				code: timedOut ? 'timeout' : 'network_error',
				attempts: attempt,
				cause
			})
		};
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener('abort', handleAbort);
	}
};

const createOpenAlexRequestClient = ({
	apiKey,
	cache,
	cacheTtlSeconds = DEFAULT_CACHE_TTL_SECONDS,
	fetch: fetchRequest = globalThis.fetch,
	maxAttempts = DEFAULT_MAX_ATTEMPTS,
	timeoutMs = DEFAULT_TIMEOUT_MS,
	waitUntil
}: OpenAlexRequestClientOptions = {}) => {
	assertPositiveInteger({ value: cacheTtlSeconds, name: 'cacheTtlSeconds' });
	assertPositiveInteger({ value: maxAttempts, name: 'maxAttempts' });
	assertPositiveInteger({ value: timeoutMs, name: 'timeoutMs' });

	const normalizedApiKey = apiKey?.trim();
	const responseCache = isOpenAlexResponseCache(cache) ? cache : undefined;

	const requestJson = async <T>({ url, schema, signal }: RequestJsonOptions<T>): Promise<T> => {
		const cacheKey = responseCache ? await createCacheKey(url) : null;

		if (responseCache && cacheKey) {
			try {
				const cachedResponse = await responseCache.match(cacheKey);

				if (cachedResponse) {
					const cachedResult = v.safeParse(schema, await cachedResponse.json());

					if (cachedResult.success) return cachedResult.output;
				}
			} catch {
				// Cache availability and integrity must never prevent a live OpenAlex request.
			}
		}

		const requestUrl = new URL(url);

		if (normalizedApiKey) requestUrl.searchParams.set('api_key', normalizedApiKey);

		let lastTransientError: OpenAlexClientError | null = null;

		for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
			const outcome = await fetchAttempt({
				url: requestUrl,
				fetchRequest,
				signal,
				timeoutMs,
				attempt
			});

			if ('error' in outcome) {
				if (outcome.error.code === 'aborted') throw outcome.error;

				lastTransientError = outcome.error;

				if (attempt < maxAttempts) {
					await waitForRetry({ delayMs: getRetryDelay({ attempt }), signal });
					continue;
				}

				break;
			}

			const { response } = outcome;
			const isTransientStatus = response.status === 429 || response.status >= 500;

			if (!response.ok && isTransientStatus) {
				lastTransientError = new OpenAlexClientError({
					message: `OpenAlex request failed with transient status ${response.status}.`,
					code: 'transient_failure',
					status: response.status,
					attempts: attempt
				});

				if (attempt < maxAttempts) {
					await waitForRetry({ delayMs: getRetryDelay({ response, attempt }), signal });
					continue;
				}

				break;
			}

			if (!response.ok) {
				throw new OpenAlexClientError({
					message: `OpenAlex request failed with status ${response.status}.`,
					code: 'http_error',
					status: response.status,
					attempts: attempt
				});
			}

			let body: unknown;

			try {
				body = await response.json();
			} catch (cause) {
				throw new OpenAlexClientError({
					message: 'OpenAlex returned invalid JSON.',
					code: 'invalid_json',
					attempts: attempt,
					cause
				});
			}

			const result = v.safeParse(schema, body);

			if (!result.success) {
				throw new OpenAlexClientError({
					message: `OpenAlex returned an unexpected response: ${v.summarize(result.issues)}`,
					code: 'invalid_response',
					attempts: attempt,
					cause: result.issues
				});
			}

			if (responseCache && cacheKey) {
				const cacheWrite = responseCache
					.put(
						cacheKey,
						new Response(JSON.stringify(result.output), {
							headers: {
								'cache-control': `public, max-age=${cacheTtlSeconds}`,
								'content-type': 'application/json'
							}
						})
					)
					.catch(() => undefined);

				if (waitUntil) waitUntil(cacheWrite);
				else await cacheWrite;
			}

			return result.output;
		}

		if (lastTransientError?.code === 'timeout') {
			throw new OpenAlexClientError({
				message: `OpenAlex request timed out after ${maxAttempts} attempts.`,
				code: 'timeout',
				attempts: maxAttempts,
				cause: lastTransientError
			});
		}

		throw new OpenAlexClientError({
			message: `OpenAlex request failed after ${maxAttempts} transient attempts.`,
			code: 'transient_failure',
			status: lastTransientError?.status,
			attempts: maxAttempts,
			cause: lastTransientError ?? undefined
		});
	};

	return { requestJson };
};

export {
	DEFAULT_CACHE_TTL_SECONDS,
	DEFAULT_MAX_ATTEMPTS,
	DEFAULT_TIMEOUT_MS,
	OpenAlexClientError,
	createOpenAlexRequestClient,
	type OpenAlexClientErrorCode,
	type OpenAlexRequestClientOptions
};
