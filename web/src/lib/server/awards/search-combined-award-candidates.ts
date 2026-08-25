import { deduplicateAwardCandidates } from './deduplicate-awards';
import { normalizeText } from './normalize-award';
import { createAwardCandidateSearchService } from './search-award-candidates';
import { createSemanticAwardCandidateSearchService } from './search-semantic-award-candidates';
import type { SemanticAwardEvidence } from './semantic-award-types';
import type {
	AwardCandidate,
	AwardCandidateSearchResult,
	SearchAwardCandidatesOptions
} from './types';

const RECIPROCAL_RANK_OFFSET = 60;

type KeywordCandidateSearchService = Pick<
	ReturnType<typeof createAwardCandidateSearchService>,
	'searchAwardCandidates'
>;

type SemanticCandidateSearchService = Pick<
	ReturnType<typeof createSemanticAwardCandidateSearchService>,
	'searchSemanticAwardCandidates'
>;

type CombinedAwardCandidateSearchServiceOptions = {
	keywordSearchService: KeywordCandidateSearchService;
	semanticSearchService: SemanticCandidateSearchService;
};

type RetrievalStatus = 'fulfilled' | 'rejected';

type CombinedAwardCandidateSearchResult = AwardCandidateSearchResult & {
	retrieval: {
		keyword: {
			status: RetrievalStatus;
			totalMatches: number;
			retrievedAwardCount: number;
			candidateCount: number;
			deduplicatedAwardCount: number;
		};
		semantic: {
			status: RetrievalStatus;
			totalWorkMatches: number;
			retrievedWorkCount: number;
			worksWithAwards: number;
			linkedAwardCount: number;
			hydratedAwardCount: number;
			candidateCount: number;
		};
		semanticEvidence: Array<{
			candidateId: string;
			evidence: SemanticAwardEvidence[];
		}>;
	};
};

const reciprocalRankScore = (index: number) => 1 / (RECIPROCAL_RANK_OFFSET + index + 1);

const sumKnownCosts = (...costs: Array<number | null | undefined>) => {
	const knownCosts = costs.filter((cost): cost is number => cost !== null && cost !== undefined);
	return knownCosts.length > 0 ? knownCosts.reduce((total, cost) => total + cost, 0) : null;
};

const getFallbackCountryCode = (countryCode: string | undefined) => {
	const normalizedCountryCode = normalizeText(countryCode)?.toUpperCase() ?? null;

	if (normalizedCountryCode && !/^[A-Z]{2}$/.test(normalizedCountryCode)) {
		throw new TypeError('countryCode must be a two-letter ISO country code.');
	}

	return normalizedCountryCode;
};

const createCombinedAwardCandidateSearchService = ({
	keywordSearchService,
	semanticSearchService
}: CombinedAwardCandidateSearchServiceOptions) => {
	const searchAwardCandidates = async (
		options: SearchAwardCandidatesOptions
	): Promise<CombinedAwardCandidateSearchResult> => {
		const [keywordOutcome, semanticOutcome] = await Promise.allSettled([
			keywordSearchService.searchAwardCandidates(options),
			semanticSearchService.searchSemanticAwardCandidates({
				description: options.description,
				workLimit: options.limit,
				awardLimit: options.limit,
				signal: options.signal
			})
		]);

		if (keywordOutcome.status === 'rejected' && semanticOutcome.status === 'rejected') {
			throw keywordOutcome.reason;
		}

		const keywordResult = keywordOutcome.status === 'fulfilled' ? keywordOutcome.value : null;
		const semanticResult = semanticOutcome.status === 'fulfilled' ? semanticOutcome.value : null;
		const relevanceByAwardId = new Map<string, number>();
		const semanticEvidenceByAwardId = new Map<string, SemanticAwardEvidence>();

		keywordResult?.candidates.forEach((candidate, index) => {
			relevanceByAwardId.set(candidate.id, reciprocalRankScore(index));
		});

		semanticResult?.candidates.forEach(({ candidate, evidence }, index) => {
			relevanceByAwardId.set(
				candidate.id,
				(relevanceByAwardId.get(candidate.id) ?? 0) + reciprocalRankScore(index)
			);
			semanticEvidenceByAwardId.set(candidate.id, evidence);
		});

		const retrievedCandidates: AwardCandidate[] = [
			...(keywordResult?.candidates ?? []),
			...(semanticResult?.candidates.map(({ candidate }) => candidate) ?? [])
		].map((candidate) => ({
			...candidate,
			relevanceScore: relevanceByAwardId.get(candidate.id) ?? null
		}));
		const candidates = deduplicateAwardCandidates(retrievedCandidates).sort(
			(left, right) => (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0)
		);
		const semanticEvidence = candidates.flatMap((candidate) => {
			const evidence = candidate.continuation.openAlexIds.flatMap((id) => {
				const value = semanticEvidenceByAwardId.get(id);
				return value ? [value] : [];
			});

			return evidence.length > 0 ? [{ candidateId: candidate.id, evidence }] : [];
		});
		const normalizedDescription =
			keywordResult?.query.description ?? normalizeText(options.description);

		if (!normalizedDescription) {
			throw new TypeError('description must not be empty.');
		}

		return {
			query: {
				description: normalizedDescription,
				countryCode:
					keywordResult?.query.countryCode ?? getFallbackCountryCode(options.countryCode),
				field: keywordResult?.query.field ?? normalizeText(options.field),
				openAlexSearch:
					keywordResult?.query.openAlexSearch ??
					semanticResult?.query.openAlexSearch ??
					normalizedDescription
			},
			meta: {
				totalOpenAlexMatches:
					keywordResult?.meta.totalOpenAlexMatches ??
					semanticResult?.meta.totalOpenAlexWorkMatches ??
					0,
				retrievedAwardCount:
					(keywordResult?.meta.retrievedAwardCount ?? 0) +
					(semanticResult?.meta.hydratedAwardCount ?? 0),
				candidateCount: candidates.length,
				deduplicatedAwardCount: retrievedCandidates.length - candidates.length,
				costUsd: sumKnownCosts(keywordResult?.meta.costUsd, semanticResult?.meta.costUsd)
			},
			candidates,
			retrieval: {
				keyword: {
					status: keywordOutcome.status,
					totalMatches: keywordResult?.meta.totalOpenAlexMatches ?? 0,
					retrievedAwardCount: keywordResult?.meta.retrievedAwardCount ?? 0,
					candidateCount: keywordResult?.meta.candidateCount ?? 0,
					deduplicatedAwardCount: keywordResult?.meta.deduplicatedAwardCount ?? 0
				},
				semantic: {
					status: semanticOutcome.status,
					totalWorkMatches: semanticResult?.meta.totalOpenAlexWorkMatches ?? 0,
					retrievedWorkCount: semanticResult?.meta.retrievedWorkCount ?? 0,
					worksWithAwards: semanticResult?.meta.worksWithLinkedAwardsCount ?? 0,
					linkedAwardCount: semanticResult?.meta.uniqueLinkedAwardCount ?? 0,
					hydratedAwardCount: semanticResult?.meta.hydratedAwardCount ?? 0,
					candidateCount: semanticResult?.meta.candidateCount ?? 0
				},
				semanticEvidence
			}
		};
	};

	return { searchAwardCandidates };
};

export {
	createCombinedAwardCandidateSearchService,
	type CombinedAwardCandidateSearchResult,
	type CombinedAwardCandidateSearchServiceOptions,
	type KeywordCandidateSearchService,
	type RetrievalStatus,
	type SemanticCandidateSearchService
};
