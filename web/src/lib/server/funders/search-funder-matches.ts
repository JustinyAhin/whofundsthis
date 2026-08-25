import { createAwardCandidateSearchService } from '$lib/server/awards/search-award-candidates';
import type { AwardCandidateSearchResult } from '$lib/server/awards/types';
import { rankAwardCandidates } from '$lib/server/scoring/rank-award-candidates';

import { aggregateFunders } from './aggregate-funders';
import type { FunderMatchSearchResult, SearchFunderMatchesOptions } from './types';

type CandidateSearchService = Pick<
	ReturnType<typeof createAwardCandidateSearchService>,
	'searchAwardCandidates'
>;

type FunderMatchSearchServiceOptions = {
	candidateSearchService?: CandidateSearchService;
};

const createFunderMatchSearchResult = (
	result: AwardCandidateSearchResult
): FunderMatchSearchResult => {
	const rankedAwards = rankAwardCandidates({
		candidates: result.candidates,
		context: {
			description: result.query.description,
			countryCode: result.query.countryCode,
			field: result.query.field
		}
	});
	const funders = aggregateFunders({
		awards: rankedAwards,
		description: result.query.description
	});

	return {
		query: {
			description: result.query.description,
			countryCode: result.query.countryCode,
			field: result.query.field
		},
		meta: {
			totalOpenAlexMatches: result.meta.totalOpenAlexMatches,
			retrievedAwardCount: result.meta.retrievedAwardCount,
			candidateCount: result.meta.candidateCount,
			deduplicatedAwardCount: result.meta.deduplicatedAwardCount,
			funderCount: funders.length,
			costUsd: result.meta.costUsd
		},
		funders
	};
};

const createFunderMatchSearchService = ({
	candidateSearchService = createAwardCandidateSearchService()
}: FunderMatchSearchServiceOptions = {}) => {
	const searchFunderMatches = async (
		options: SearchFunderMatchesOptions
	): Promise<FunderMatchSearchResult> => {
		const result = await candidateSearchService.searchAwardCandidates(options);

		return createFunderMatchSearchResult(result);
	};

	return { searchFunderMatches };
};

export {
	createFunderMatchSearchResult,
	createFunderMatchSearchService,
	type CandidateSearchService,
	type FunderMatchSearchServiceOptions
};
