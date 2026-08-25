import type { AwardCandidate } from './types';

type SemanticWorkEvidence = {
	id: string;
	openAlexUrl: string;
	doi: string | null;
	doiUrl: string | null;
	title: string | null;
	publicationYear: number | null;
	relevanceScore: number | null;
};

type SemanticAwardReference = {
	id: string;
	openAlexUrl: string;
	title: string | null;
	funderAwardId: string | null;
	funder: {
		id: string;
		name: string | null;
	} | null;
};

type SemanticAwardEvidence = {
	source: 'openalex-semantic-work';
	award: SemanticAwardReference;
	works: SemanticWorkEvidence[];
	bestWorkRelevanceScore: number | null;
};

type SemanticAwardCandidate = {
	candidate: AwardCandidate;
	evidence: SemanticAwardEvidence;
};

type SearchSemanticAwardCandidatesOptions = {
	description: string;
	workLimit?: number;
	awardLimit?: number;
	signal?: AbortSignal;
};

type SemanticAwardCandidateSearchResult = {
	query: {
		description: string;
		openAlexSearch: string;
	};
	meta: {
		totalOpenAlexWorkMatches: number;
		retrievedWorkCount: number;
		worksWithLinkedAwardsCount: number;
		linkedAwardReferenceCount: number;
		uniqueLinkedAwardCount: number;
		selectedLinkedAwardCount: number;
		hydratedAwardCount: number;
		candidateCount: number;
		costUsd: number | null;
	};
	candidates: SemanticAwardCandidate[];
};

export {
	type SearchSemanticAwardCandidatesOptions,
	type SemanticAwardCandidate,
	type SemanticAwardCandidateSearchResult,
	type SemanticAwardEvidence,
	type SemanticAwardReference,
	type SemanticWorkEvidence
};
