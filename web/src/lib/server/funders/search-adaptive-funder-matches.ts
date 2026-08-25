import { createCombinedAwardCandidateSearchService } from '$lib/server/awards/search-combined-award-candidates';
import type {
	KeywordCandidateSearchService,
	SemanticCandidateSearchService
} from '$lib/server/awards/search-combined-award-candidates';
import type { AwardCandidateSearchResult } from '$lib/server/awards/types';

import { createFunderMatchSearchResult } from './search-funder-matches';
import type { FunderMatchSearchResult, SearchFunderMatchesOptions } from './types';

const MIN_KEYWORD_CANDIDATES = 15;
const MIN_TOP_FUNDER_SCORE = 70;
const BEST_AWARD_WEIGHT = 0.6;
const TOP_AWARDS_WEIGHT = 0.4;

type AdaptiveFunderMatchSearchServiceOptions = {
	keywordSearchService: KeywordCandidateSearchService;
	semanticSearchService: SemanticCandidateSearchService;
};

// Reconstruct the calibrated funder evidence score before the title-evidence display boost.
const getFunderEvidenceScore = (funder: FunderMatchSearchResult['funders'][number]) => {
	const awardScores = funder.representativeAwards.map((award) => award.score.total);
	const averageTopAwardScore =
		awardScores.length > 0
			? awardScores.reduce((total, score) => total + score, 0) / awardScores.length
			: funder.score.bestAward;

	return Math.round(
		funder.score.bestAward * BEST_AWARD_WEIGHT + averageTopAwardScore * TOP_AWARDS_WEIGHT
	);
};

const getTopFunderEvidenceScore = (funders: FunderMatchSearchResult['funders']) =>
	funders.reduce((topScore, funder) => Math.max(topScore, getFunderEvidenceScore(funder)), 0);

const shouldUseSemanticRetrieval = (result: FunderMatchSearchResult) =>
	result.meta.candidateCount < MIN_KEYWORD_CANDIDATES ||
	getTopFunderEvidenceScore(result.funders) < MIN_TOP_FUNDER_SCORE;

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
	getFunderEvidenceScore,
	getTopFunderEvidenceScore,
	shouldUseSemanticRetrieval,
	type AdaptiveFunderMatchSearchServiceOptions
};
