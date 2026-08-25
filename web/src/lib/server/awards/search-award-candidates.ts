import { createOpenAlexClient } from '$lib/server/openalex/client';

import { deduplicateAwardCandidates } from './deduplicate-awards';
import { normalizeOpenAlexAward, normalizeText } from './normalize-award';
import type { AwardCandidateSearchResult, SearchAwardCandidatesOptions } from './types';

const DEFAULT_CANDIDATE_LIMIT = 50;
const MAX_CANDIDATE_LIMIT = 100;
const MAX_SEARCH_TERMS = 6;

const SEARCH_STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'as',
	'at',
	'by',
	'for',
	'from',
	'in',
	'into',
	'of',
	'on',
	'or',
	'that',
	'the',
	'to',
	'using',
	'with'
]);

const GENERIC_RESEARCH_TERMS = new Set([
	'africa',
	'approach',
	'develop',
	'developing',
	'development',
	'effect',
	'effects',
	'evaluate',
	'evaluation',
	'impact',
	'improve',
	'improving',
	'project',
	'protect',
	'protecting',
	'protects',
	'research',
	'study',
	'west',
	'women'
]);

const SEARCH_TERM_NORMALIZATIONS: Record<string, string> = {
	pregnant: 'pregnancy'
};

type AwardSearchClient = Pick<ReturnType<typeof createOpenAlexClient>, 'searchAwards'>;

type AwardCandidateSearchServiceOptions = {
	client?: AwardSearchClient;
};

const normalizeCountryCode = (value: string | undefined) => {
	const countryCode = normalizeText(value)?.toUpperCase() ?? null;

	if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
		throw new TypeError('countryCode must be a two-letter ISO country code.');
	}

	return countryCode;
};

const assertCandidateLimit = (limit: number) => {
	if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CANDIDATE_LIMIT) {
		throw new RangeError(`limit must be an integer from 1 to ${MAX_CANDIDATE_LIMIT}.`);
	}
};

const buildOpenAlexSearch = (description: string) => {
	const terms = description
		.toLocaleLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.split(/[^a-z0-9]+/)
		.map((term) => SEARCH_TERM_NORMALIZATIONS[term] ?? term)
		.filter(
			(term) => term.length > 2 && !SEARCH_STOP_WORDS.has(term) && !GENERIC_RESEARCH_TERMS.has(term)
		);
	const uniqueTerms = [...new Set(terms)].slice(0, MAX_SEARCH_TERMS);

	return uniqueTerms.length >= 2 ? uniqueTerms.join(' ') : description;
};

const createAwardCandidateSearchService = ({
	client = createOpenAlexClient()
}: AwardCandidateSearchServiceOptions = {}) => {
	const searchAwardCandidates = async ({
		description,
		countryCode,
		field,
		limit = DEFAULT_CANDIDATE_LIMIT,
		signal
	}: SearchAwardCandidatesOptions): Promise<AwardCandidateSearchResult> => {
		const normalizedDescription = normalizeText(description);

		if (!normalizedDescription) {
			throw new TypeError('description must not be empty.');
		}

		assertCandidateLimit(limit);

		const normalizedField = normalizeText(field);
		const normalizedCountryCode = normalizeCountryCode(countryCode);
		const openAlexSearch = buildOpenAlexSearch(normalizedDescription);
		const page = await client.searchAwards({ query: openAlexSearch, perPage: limit, signal });
		const normalizedAwards = page.results.map(normalizeOpenAlexAward);
		const candidates = deduplicateAwardCandidates(normalizedAwards).sort(
			(left, right) => (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0)
		);

		return {
			query: {
				description: normalizedDescription,
				countryCode: normalizedCountryCode,
				field: normalizedField,
				openAlexSearch
			},
			meta: {
				totalOpenAlexMatches: page.meta.count,
				retrievedAwardCount: page.results.length,
				candidateCount: candidates.length,
				deduplicatedAwardCount: page.results.length - candidates.length,
				costUsd: page.meta.cost_usd ?? null
			},
			candidates
		};
	};

	return { searchAwardCandidates };
};

export {
	buildOpenAlexSearch,
	createAwardCandidateSearchService,
	type AwardCandidateSearchServiceOptions,
	type AwardSearchClient
};
