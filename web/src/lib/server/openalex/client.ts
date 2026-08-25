import * as v from 'valibot';
import { openAlexAwardsPageSchema, type OpenAlexAwardsPage } from './schemas';

const DEFAULT_BASE_URL = 'https://api.openalex.org/';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type OpenAlexClientOptions = {
	apiKey?: string;
	baseUrl?: string;
	fetch?: typeof globalThis.fetch;
};

type SearchAwardsOptions = {
	query: string;
	page?: number;
	perPage?: number;
	signal?: AbortSignal;
};

type OpenAlexClientErrorCode = 'network_error' | 'http_error' | 'invalid_json' | 'invalid_response';

class OpenAlexClientError extends Error {
	readonly code: OpenAlexClientErrorCode;
	readonly status?: number;

	constructor({
		message,
		code,
		status,
		cause
	}: {
		message: string;
		code: OpenAlexClientErrorCode;
		status?: number;
		cause?: unknown;
	}) {
		super(message, { cause });
		this.name = 'OpenAlexClientError';
		this.code = code;
		this.status = status;
	}
}

const assertPositiveInteger = ({
	value,
	name,
	maximum
}: {
	value: number;
	name: string;
	maximum?: number;
}) => {
	if (!Number.isInteger(value) || value < 1 || (maximum !== undefined && value > maximum)) {
		const range = maximum === undefined ? 'a positive integer' : `an integer from 1 to ${maximum}`;
		throw new RangeError(`${name} must be ${range}.`);
	}
};

const createOpenAlexClient = ({
	apiKey,
	baseUrl = DEFAULT_BASE_URL,
	fetch: fetchRequest = globalThis.fetch
}: OpenAlexClientOptions = {}) => {
	const awardsUrl = new URL('awards', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

	const searchAwards = async ({
		query,
		page = 1,
		perPage = DEFAULT_PAGE_SIZE,
		signal
	}: SearchAwardsOptions): Promise<OpenAlexAwardsPage> => {
		const normalizedQuery = query.trim();

		if (!normalizedQuery) {
			throw new TypeError('query must not be empty.');
		}

		assertPositiveInteger({ value: page, name: 'page' });
		assertPositiveInteger({ value: perPage, name: 'perPage', maximum: MAX_PAGE_SIZE });

		const url = new URL(awardsUrl);
		url.searchParams.set('search', normalizedQuery);
		url.searchParams.set('page', String(page));
		url.searchParams.set('per_page', String(perPage));

		if (apiKey) {
			url.searchParams.set('api_key', apiKey);
		}

		let response: Response;

		try {
			response = await fetchRequest(url, {
				headers: { accept: 'application/json' },
				signal
			});
		} catch (cause) {
			throw new OpenAlexClientError({
				message: 'OpenAlex request could not be completed.',
				code: 'network_error',
				cause
			});
		}

		if (!response.ok) {
			throw new OpenAlexClientError({
				message: `OpenAlex request failed with status ${response.status}.`,
				code: 'http_error',
				status: response.status
			});
		}

		let body: unknown;

		try {
			body = await response.json();
		} catch (cause) {
			throw new OpenAlexClientError({
				message: 'OpenAlex returned invalid JSON.',
				code: 'invalid_json',
				cause
			});
		}

		const result = v.safeParse(openAlexAwardsPageSchema, body);

		if (!result.success) {
			throw new OpenAlexClientError({
				message: `OpenAlex returned an unexpected response: ${v.summarize(result.issues)}`,
				code: 'invalid_response',
				cause: result.issues
			});
		}

		return result.output;
	};

	return { searchAwards };
};

export {
	OpenAlexClientError,
	createOpenAlexClient,
	type OpenAlexClientErrorCode,
	type OpenAlexClientOptions,
	type SearchAwardsOptions
};
