import {
	OpenAlexClientError,
	createOpenAlexRequestClient,
	type OpenAlexClientErrorCode,
	type OpenAlexRequestClientOptions
} from './request';
import { openAlexAwardsPageSchema, type OpenAlexAwardsPage } from './schemas';

const DEFAULT_BASE_URL = 'https://api.openalex.org/';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type OpenAlexClientOptions = OpenAlexRequestClientOptions & {
	baseUrl?: string;
};

type SearchAwardsOptions = {
	query: string;
	page?: number;
	perPage?: number;
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

const createOpenAlexClient = ({
	baseUrl = DEFAULT_BASE_URL,
	...requestOptions
}: OpenAlexClientOptions = {}) => {
	const awardsUrl = new URL('awards', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
	const requestClient = createOpenAlexRequestClient(requestOptions);

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

		return requestClient.requestJson({ url, schema: openAlexAwardsPageSchema, signal });
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
