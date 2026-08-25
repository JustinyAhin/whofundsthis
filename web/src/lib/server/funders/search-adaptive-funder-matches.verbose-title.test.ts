import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
	getTopFunderEvidenceScore,
	shouldUseSemanticRetrieval
} from './search-adaptive-funder-matches';
import { getTitleEvidence } from './aggregate-funders';
import type { FunderMatchSearchResult } from './types';
import type { ScoredAwardCandidate } from '$lib/server/scoring/types';

const createKeywordResult = ({
	finalScore,
	bestAwardScore,
	titleEvidenceContribution,
	candidateCount = 15
}: {
	finalScore: number;
	bestAwardScore: number;
	titleEvidenceContribution: number;
	candidateCount?: number;
}) =>
	({
		meta: {
			candidateCount
		},
		funders: [
			{
				score: {
					total: finalScore,
					bestAward: bestAwardScore,
					titleEvidence: {
						contribution: titleEvidenceContribution
					}
				},
				representativeAwards: [
					{
						score: {
							total: bestAwardScore
						}
					}
				]
			}
		]
	}) as FunderMatchSearchResult;

describe('adaptive semantic retrieval', () => {
	test('a verbose-title bonus cannot suppress semantic retrieval', () => {
		const result = createKeywordResult({
			finalScore: 77,
			bestAwardScore: 69,
			titleEvidenceContribution: 8
		});

		assert.equal(getTopFunderEvidenceScore(result.funders), 69);
		assert.equal(shouldUseSemanticRetrieval(result), true);
	});

	test('strong unboosted evidence still avoids semantic retrieval', () => {
		const result = createKeywordResult({
			finalScore: 78,
			bestAwardScore: 70,
			titleEvidenceContribution: 8
		});

		assert.equal(getTopFunderEvidenceScore(result.funders), 70);
		assert.equal(shouldUseSemanticRetrieval(result), false);
	});

	test('the Benin-sized keyword set triggers semantic retrieval without raising the score threshold', () => {
		const result = createKeywordResult({
			finalScore: 77,
			bestAwardScore: 71,
			titleEvidenceContribution: 6,
			candidateCount: 14
		});

		assert.equal(shouldUseSemanticRetrieval(result), true);
	});
});

describe('title evidence', () => {
	test('discounts incidental term coverage in an abnormally long award title', () => {
		const description = 'Community health workers improving maternal care in rural Benin';
		const createAward = (title: string) => ({ candidate: { title } }) as ScoredAwardCandidate;
		const concise = getTitleEvidence({
			description,
			bestAward: createAward(description)
		});
		const verbose = getTitleEvidence({
			description,
			bestAward: createAward(
				`${description} ${Array.from({ length: 100 }, (_, index) => `unrelated${index}`).join(' ')}`
			)
		});

		assert.equal(concise.contribution, 8);
		assert.ok(verbose.contribution < 2);
		assert.deepEqual(verbose.matchedTerms, concise.matchedTerms);
	});
});
