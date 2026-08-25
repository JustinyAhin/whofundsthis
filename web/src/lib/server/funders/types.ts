import type { ScoredAwardCandidate } from '$lib/server/scoring/types';
import type { SearchAwardCandidatesOptions } from '$lib/server/awards/types';

type FundingRange = {
	currency: string;
	minimum: number;
	maximum: number;
	awardCount: number;
};

type FunderDimensionSummary = {
	textRelevance: number;
	topicOverlap: number;
	geography: number;
	recency: number;
	metadataConfidence: number;
};

type FunderMatch = {
	id: string;
	name: string;
	doi: string | null;
	doiUrl: string | null;
	score: {
		total: number;
		bestAward: number;
		titleEvidence: {
			score: number;
			contribution: number;
			matchedTerms: string[];
		};
		geographyEvidence: {
			status: 'not-requested' | 'matched' | 'mixed' | 'outside' | 'missing';
			matchedAwardCount: number;
			outsideAwardCount: number;
			missingAwardCount: number;
		};
		dimensions: FunderDimensionSummary;
	};
	matchingAwardCount: number;
	evidenceRecordCount: number;
	representativeAwards: ScoredAwardCandidate[];
	whyThisFunder: string[];
	countries: string[];
	institutions: string[];
	investigators: string[];
	schemes: string[];
	fundingRanges: FundingRange[];
	awardYearRange: {
		minimum: number | null;
		maximum: number | null;
	};
	fundedOutputsCount: number;
	sourceCount: number;
};

type FunderMatchSearchResult = {
	query: {
		description: string;
		countryCode: string | null;
		field: string | null;
	};
	meta: {
		totalOpenAlexMatches: number;
		retrievedAwardCount: number;
		candidateCount: number;
		deduplicatedAwardCount: number;
		funderCount: number;
		costUsd: number | null;
	};
	funders: FunderMatch[];
};

type SearchFunderMatchesOptions = SearchAwardCandidatesOptions;

export {
	type FunderDimensionSummary,
	type FunderMatch,
	type FunderMatchSearchResult,
	type FundingRange,
	type SearchFunderMatchesOptions
};
