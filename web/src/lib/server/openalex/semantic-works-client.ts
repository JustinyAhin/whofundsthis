import * as v from 'valibot';

import { OpenAlexClientError } from './client';
import { openAlexAwardsPageSchema, type OpenAlexAwardsPage } from './schemas';
import { semanticWorksPageSchema, type OpenAlexSemanticWorksPage } from './semantic-work-schemas';

const DEFAULT_BASE_URL = 'https://api.openalex.org/';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_FILTER_IDS = 100;
const SEMANTIC_WORK_SELECT = 'id,doi,title,publication_year,awards,relevance_score';

type SemanticWorksClientOptions = {
	apiKey?: string;
	baseUrl?: string;
	fetch?: typeof globalThis.fetch;
};

type SearchSemanticWorksOptions = {
	query: string;
	page?: number;
	perPage?: number;
	signal?: AbortSignal;
};

type GetAwardsByIdsOptions = {
	ids: string[];
	signal?: AbortSignal;
};

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

const normalizeOpenAlexEntityId = (value: string) =>
	value
		.trim()
		.replace(/^https?:\/\/openalex\.org\//i, '')
		.toUpperCase();

const createSemanticWorksClient = ({
	apiKey,
	baseUrl = DEFAULT_BASE_URL,
	fetch: fetchRequest = globalThis.fetch
}: SemanticWorksClientOptions = {}) => {
	const normalizedApiKey = apiKey?.trim();
	const apiUrl = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

	const requestPage = async <T>({
		url,
		schema,
		signal
	}: {
		url: URL;
		schema: v.GenericSchema<unknown, T>;
		signal?: AbortSignal;
	}): Promise<T> => {
		if (normalizedApiKey) {
			url.searchParams.set('api_key', normalizedApiKey);
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

		const result = v.safeParse(schema, body);

		if (!result.success) {
			throw new OpenAlexClientError({
				message: `OpenAlex returned an unexpected response: ${v.summarize(result.issues)}`,
				code: 'invalid_response',
				cause: result.issues
			});
		}

		return result.output;
	};

	const searchSemanticWorks = async ({
		query,
		page = 1,
		perPage = DEFAULT_PAGE_SIZE,
		signal
	}: SearchSemanticWorksOptions): Promise<OpenAlexSemanticWorksPage> => {
		const normalizedQuery = query.trim();

		if (!normalizedQuery) {
			throw new TypeError('query must not be empty.');
		}

		assertPositiveInteger({ value: page, name: 'page' });
		assertPositiveInteger({ value: perPage, name: 'perPage', maximum: MAX_PAGE_SIZE });

		const url = new URL('works', apiUrl);
		url.searchParams.set('search.semantic', normalizedQuery);
		url.searchParams.set('page', String(page));
		url.searchParams.set('per_page', String(perPage));
		url.searchParams.set('select', SEMANTIC_WORK_SELECT);

		return requestPage({ url, schema: semanticWorksPageSchema, signal });
	};

	const getAwardsByIds = async ({
		ids,
		signal
	}: GetAwardsByIdsOptions): Promise<OpenAlexAwardsPage> => {
		const normalizedIds = [...new Set(ids.map(normalizeOpenAlexEntityId).filter(Boolean))];

		if (normalizedIds.length === 0) {
			throw new TypeError('ids must contain at least one OpenAlex award ID.');
		}

		if (normalizedIds.length > MAX_FILTER_IDS) {
			throw new RangeError(`ids must contain at most ${MAX_FILTER_IDS} unique OpenAlex award IDs.`);
		}

		if (normalizedIds.some((id) => !/^G\d+$/.test(id))) {
			throw new TypeError('ids must contain only OpenAlex award IDs.');
		}

		const url = new URL('awards', apiUrl);
		url.searchParams.set(
			'filter',
			`id:${normalizedIds.map((id) => `https://openalex.org/${id}`).join('|')}`
		);
		url.searchParams.set('per_page', String(normalizedIds.length));

		return requestPage({ url, schema: openAlexAwardsPageSchema, signal });
	};

	return { getAwardsByIds, searchSemanticWorks };
};

export {
	createSemanticWorksClient,
	type GetAwardsByIdsOptions,
	type SearchSemanticWorksOptions,
	type SemanticWorksClientOptions
};
