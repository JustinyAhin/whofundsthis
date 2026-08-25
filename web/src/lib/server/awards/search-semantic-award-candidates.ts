import {
	normalizeDoi,
	normalizeOpenAlexAward,
	normalizeOpenAlexId,
	normalizeText
} from './normalize-award';
import type {
	SearchSemanticAwardCandidatesOptions,
	SemanticAwardCandidate,
	SemanticAwardCandidateSearchResult,
	SemanticAwardEvidence,
	SemanticAwardReference,
	SemanticWorkEvidence
} from './semantic-award-types';
import { createSemanticWorksClient } from '$lib/server/openalex/semantic-works-client';
import type { OpenAlexSemanticWorkAward } from '$lib/server/openalex/semantic-work-schemas';

const OPENALEX_URL = 'https://openalex.org/';
const DOI_URL = 'https://doi.org/';
const DEFAULT_WORK_LIMIT = 50;
const MAX_WORK_LIMIT = 100;
const DEFAULT_AWARD_LIMIT = 100;
const MAX_AWARD_LIMIT = 100;

type SemanticAwardSearchClient = Pick<
	ReturnType<typeof createSemanticWorksClient>,
	'getAwardsByIds' | 'searchSemanticWorks'
>;

type SemanticAwardCandidateSearchServiceOptions = {
	client: SemanticAwardSearchClient;
};

const assertLimit = ({
	value,
	name,
	maximum
}: {
	value: number;
	name: string;
	maximum: number;
}) => {
	if (!Number.isInteger(value) || value < 1 || value > maximum) {
		throw new RangeError(`${name} must be an integer from 1 to ${maximum}.`);
	}
};

const normalizeSemanticWorkEvidence = ({
	id,
	doi,
	title,
	publication_year: publicationYear,
	relevance_score: relevanceScore
}: {
	id: string;
	doi?: string | null;
	title?: string | null;
	publication_year?: number | null;
	relevance_score?: number | null;
}): SemanticWorkEvidence => {
	const normalizedId = normalizeOpenAlexId(id);
	const normalizedDoi = normalizeDoi(doi);

	return {
		id: normalizedId,
		openAlexUrl: `${OPENALEX_URL}${normalizedId}`,
		doi: normalizedDoi,
		doiUrl: normalizedDoi ? `${DOI_URL}${normalizedDoi}` : null,
		title: normalizeText(title),
		publicationYear: publicationYear ?? null,
		relevanceScore: relevanceScore ?? null
	};
};

const normalizeSemanticAwardReference = (
	award: OpenAlexSemanticWorkAward
): SemanticAwardReference => {
	const id = normalizeOpenAlexId(award.id);
	const funderId = award.funder_id ? normalizeOpenAlexId(award.funder_id) : null;

	return {
		id,
		openAlexUrl: `${OPENALEX_URL}${id}`,
		title: normalizeText(award.display_name),
		funderAwardId: normalizeText(award.funder_award_id),
		funder: funderId
			? {
					id: funderId,
					name: normalizeText(award.funder_display_name)
				}
			: null
	};
};

const compareWorkEvidence = (left: SemanticWorkEvidence, right: SemanticWorkEvidence) =>
	(right.relevanceScore ?? 0) - (left.relevanceScore ?? 0);

const sumKnownCosts = (...costs: Array<number | null | undefined>) => {
	const knownCosts = costs.filter((cost): cost is number => cost !== null && cost !== undefined);
	return knownCosts.length > 0 ? knownCosts.reduce((total, cost) => total + cost, 0) : null;
};

const createSemanticAwardCandidateSearchService = ({
	client
}: SemanticAwardCandidateSearchServiceOptions) => {
	const searchSemanticAwardCandidates = async ({
		description,
		workLimit = DEFAULT_WORK_LIMIT,
		awardLimit = DEFAULT_AWARD_LIMIT,
		signal
	}: SearchSemanticAwardCandidatesOptions): Promise<SemanticAwardCandidateSearchResult> => {
		const normalizedDescription = normalizeText(description);

		if (!normalizedDescription) {
			throw new TypeError('description must not be empty.');
		}

		assertLimit({ value: workLimit, name: 'workLimit', maximum: MAX_WORK_LIMIT });
		assertLimit({ value: awardLimit, name: 'awardLimit', maximum: MAX_AWARD_LIMIT });

		const worksPage = await client.searchSemanticWorks({
			query: normalizedDescription,
			perPage: workLimit,
			signal
		});
		const evidenceByAwardId = new Map<string, SemanticAwardEvidence>();
		const discoveredAwardIds = new Set<string>();
		let linkedAwardReferenceCount = 0;
		let worksWithLinkedAwardsCount = 0;

		for (const work of worksPage.results) {
			const awards = work.awards ?? [];

			if (awards.length > 0) {
				worksWithLinkedAwardsCount += 1;
			}

			for (const award of awards) {
				linkedAwardReferenceCount += 1;
				const awardReference = normalizeSemanticAwardReference(award);
				discoveredAwardIds.add(awardReference.id);
				const workEvidence = normalizeSemanticWorkEvidence(work);
				const existing = evidenceByAwardId.get(awardReference.id);

				if (existing) {
					existing.works.push(workEvidence);
				} else if (evidenceByAwardId.size < awardLimit) {
					evidenceByAwardId.set(awardReference.id, {
						source: 'openalex-semantic-work',
						award: awardReference,
						works: [workEvidence],
						bestWorkRelevanceScore: null
					});
				}
			}
		}

		for (const evidence of evidenceByAwardId.values()) {
			evidence.works.sort(compareWorkEvidence);
			evidence.bestWorkRelevanceScore = evidence.works[0]?.relevanceScore ?? null;
		}

		if (evidenceByAwardId.size === 0) {
			return {
				query: {
					description: normalizedDescription,
					openAlexSearch: normalizedDescription
				},
				meta: {
					totalOpenAlexWorkMatches: worksPage.meta.count,
					retrievedWorkCount: worksPage.results.length,
					worksWithLinkedAwardsCount,
					linkedAwardReferenceCount,
					uniqueLinkedAwardCount: discoveredAwardIds.size,
					selectedLinkedAwardCount: 0,
					hydratedAwardCount: 0,
					candidateCount: 0,
					costUsd: worksPage.meta.cost_usd ?? null
				},
				candidates: []
			};
		}

		const awardsPage = await client.getAwardsByIds({ ids: [...evidenceByAwardId.keys()], signal });
		const candidates: SemanticAwardCandidate[] = awardsPage.results
			.map(normalizeOpenAlexAward)
			.flatMap((candidate) => {
				const evidence = evidenceByAwardId.get(candidate.id);
				return evidence ? [{ candidate, evidence }] : [];
			})
			.sort(
				(left, right) =>
					(right.evidence.bestWorkRelevanceScore ?? 0) - (left.evidence.bestWorkRelevanceScore ?? 0)
			);

		return {
			query: {
				description: normalizedDescription,
				openAlexSearch: normalizedDescription
			},
			meta: {
				totalOpenAlexWorkMatches: worksPage.meta.count,
				retrievedWorkCount: worksPage.results.length,
				worksWithLinkedAwardsCount,
				linkedAwardReferenceCount,
				uniqueLinkedAwardCount: discoveredAwardIds.size,
				selectedLinkedAwardCount: evidenceByAwardId.size,
				hydratedAwardCount: awardsPage.results.length,
				candidateCount: candidates.length,
				costUsd: sumKnownCosts(worksPage.meta.cost_usd, awardsPage.meta.cost_usd)
			},
			candidates
		};
	};

	return { searchSemanticAwardCandidates };
};

export {
	createSemanticAwardCandidateSearchService,
	type SemanticAwardCandidateSearchServiceOptions,
	type SemanticAwardSearchClient
};
