import type { AwardCandidate } from '$lib/server/awards/types';

type AwardScoringContext = {
	description: string;
	countryCode: string | null;
	field: string | null;
	referenceYear?: number;
	maxOpenAlexRelevance?: number;
};

type ScoreDimension = {
	score: number;
	weight: number;
	contribution: number;
	explanation: string;
	evidence: string[];
};

type AwardScoreBreakdown = {
	total: number;
	dimensions: {
		textRelevance: ScoreDimension;
		topicOverlap: ScoreDimension;
		geography: ScoreDimension;
		recency: ScoreDimension;
		metadataConfidence: ScoreDimension;
	};
};

type ScoredAwardCandidate = {
	candidate: AwardCandidate;
	score: AwardScoreBreakdown;
};

export {
	type AwardScoreBreakdown,
	type AwardScoringContext,
	type ScoredAwardCandidate,
	type ScoreDimension
};
