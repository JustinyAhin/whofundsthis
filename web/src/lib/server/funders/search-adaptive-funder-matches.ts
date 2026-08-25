import { createCombinedAwardCandidateSearchService } from '$lib/server/awards/search-combined-award-candidates';
import type {
	KeywordCandidateSearchService,
	SemanticCandidateSearchService
} from '$lib/server/awards/search-combined-award-candidates';
import type { AwardCandidateSearchResult } from '$lib/server/awards/types';

import { createFunderMatchSearchResult } from './search-funder-matches';
import type { FunderMatchSearchResult, SearchFunderMatchesOptions } from './types';

const MIN_KEYWORD_CANDIDATES = 10;
const MIN_TOP_FUNDER_SCORE = 70;

type AdaptiveFunderMatchSearchServiceOptions = {
	keywordSearchService: KeywordCandidateSearchService;
	semanticSearchService: SemanticCandidateSearchService;
};

const shouldUseSemanticRetrieval = (result: FunderMatchSearchResult) =>
	result.meta.candidateCount < MIN_KEYWORD_CANDIDATES ||
	(result.funders[0]?.score.total ?? 0) < MIN_TOP_FUNDER_SCORE;

const createAdaptiveFunderMatchSearchService = ({
	keywordSearchService,
	semanticSearchService
}: AdaptiveFunderMatchSearchServiceOptions) => {
	const searchFunderMatches = async (
		options: SearchFunderMatchesOptions
	): Promise<FunderMatchSearchResult> => {
		let keywordCandidates: AwardCandidateSearchResult;

		try {
			keywordCandidates = await keywordSearchService.searchAwardCandidates(options);
		} catch (keywordError) {
			const semanticFallbackService = createCombinedAwardCandidateSearchService({
				keywordSearchService: {
					searchAwardCandidates: async () => {
						throw keywordError;
					}
				},
				semanticSearchService
			});
			const semanticFallbackCandidates =
				await semanticFallbackService.searchAwardCandidates(options);

			return createFunderMatchSearchResult(semanticFallbackCandidates);
		}

		const keywordResult = createFunderMatchSearchResult(keywordCandidates);

		if (!shouldUseSemanticRetrieval(keywordResult)) return keywordResult;

		const combinedSearchService = createCombinedAwardCandidateSearchService({
			keywordSearchService: {
				searchAwardCandidates: async () => keywordCandidates
			},
			semanticSearchService
		});
		const combinedCandidates = await combinedSearchService.searchAwardCandidates(options);

		return createFunderMatchSearchResult(combinedCandidates);
	};

	return { searchFunderMatches };
};

export {
	MIN_KEYWORD_CANDIDATES,
	MIN_TOP_FUNDER_SCORE,
	createAdaptiveFunderMatchSearchService,
	shouldUseSemanticRetrieval,
	type AdaptiveFunderMatchSearchServiceOptions
};
