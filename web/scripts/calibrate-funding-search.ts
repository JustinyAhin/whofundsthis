import { buildOpenAlexSearch } from '../src/lib/server/awards/search-award-candidates';
import { createCombinedAwardCandidateSearchService } from '../src/lib/server/awards/search-combined-award-candidates';
import { createAwardCandidateSearchService } from '../src/lib/server/awards/search-award-candidates';
import { createSemanticAwardCandidateSearchService } from '../src/lib/server/awards/search-semantic-award-candidates';
import { aggregateFunders } from '../src/lib/server/funders/aggregate-funders';
import {
	MIN_KEYWORD_CANDIDATES,
	MIN_TOP_FUNDER_SCORE
} from '../src/lib/server/funders/search-adaptive-funder-matches';
import { createFunderMatchSearchService } from '../src/lib/server/funders/search-funder-matches';
import type { FunderMatch, SearchFunderMatchesOptions } from '../src/lib/server/funders/types';
import { createOpenAlexClient } from '../src/lib/server/openalex/client';
import { createSemanticWorksClient } from '../src/lib/server/openalex/semantic-works-client';
import { rankAwardCandidates } from '../src/lib/server/scoring/rank-award-candidates';

import { CALIBRATION_CASES, type CalibrationCase } from './calibration-cases';

const TOP_FUNDER_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 30_000;

type RetrievalStage = {
	id: string;
	query: string | null;
	totalMatches: number;
	retrievedAwardCount: number;
	candidateCount: number;
	deduplicatedAwardCount: number;
};

type CalibrationStrategyResult = {
	candidateCount: number;
	funders: FunderMatch[];
	retrieval: RetrievalStage[];
	costUsd: number | null;
};

type CalibrationStrategy = {
	id: string;
	label: string;
	search: (options: SearchFunderMatchesOptions) => Promise<CalibrationStrategyResult>;
};

type CalibrationRun = {
	calibrationCase: CalibrationCase;
	strategy: CalibrationStrategy;
	result: CalibrationStrategyResult | null;
	error: string | null;
};

const createSharedFetch = ({ fetch: fetchRequest = globalThis.fetch } = {}) => {
	const responses = new Map<string, Promise<Response>>();

	return async (input: string | URL | Request, init?: RequestInit) => {
		const request = new Request(input, init);

		if (request.method !== 'GET') return fetchRequest(request);

		const key = request.url;
		let responsePromise = responses.get(key);

		if (!responsePromise) {
			responsePromise = fetchRequest(request).then(
				(response) => {
					if (!response.ok) responses.delete(key);
					return response;
				},
				(error) => {
					responses.delete(key);
					throw error;
				}
			);
			responses.set(key, responsePromise);
		}

		return (await responsePromise).clone();
	};
};

const createKeywordStrategy = ({
	fetch
}: { fetch?: typeof globalThis.fetch } = {}): CalibrationStrategy => {
	const service = createFunderMatchSearchService({
		candidateSearchService: createAwardCandidateSearchService({
			client: createOpenAlexClient({ fetch })
		})
	});

	return {
		id: 'keyword',
		label: 'OpenAlex award keyword search',
		search: async (options) => {
			const result = await service.searchFunderMatches(options);

			return {
				candidateCount: result.meta.candidateCount,
				funders: result.funders,
				retrieval: [
					{
						id: 'awards-keyword',
						query: buildOpenAlexSearch(options.description),
						totalMatches: result.meta.totalOpenAlexMatches,
						retrievedAwardCount: result.meta.retrievedAwardCount,
						candidateCount: result.meta.candidateCount,
						deduplicatedAwardCount: result.meta.deduplicatedAwardCount
					}
				],
				costUsd: result.meta.costUsd
			};
		}
	};
};

const createCombinedStrategy = ({
	fetch
}: { fetch?: typeof globalThis.fetch } = {}): CalibrationStrategy => {
	const service = createCombinedAwardCandidateSearchService({
		keywordSearchService: createAwardCandidateSearchService({
			client: createOpenAlexClient({ fetch })
		}),
		semanticSearchService: createSemanticAwardCandidateSearchService({
			client: createSemanticWorksClient({ fetch })
		})
	});

	return {
		id: 'combined',
		label: 'Keyword awards plus semantic works',
		search: async (options) => {
			const result = await service.searchAwardCandidates(options);
			const rankedAwards = rankAwardCandidates({
				candidates: result.candidates,
				context: {
					description: result.query.description,
					countryCode: result.query.countryCode,
					field: result.query.field
				}
			});

			return {
				candidateCount: result.meta.candidateCount,
				funders: aggregateFunders({
					awards: rankedAwards,
					description: result.query.description
				}),
				retrieval: [
					{
						id: `awards-keyword:${result.retrieval.keyword.status}`,
						query: buildOpenAlexSearch(options.description),
						totalMatches: result.retrieval.keyword.totalMatches,
						retrievedAwardCount: result.retrieval.keyword.retrievedAwardCount,
						candidateCount: result.retrieval.keyword.candidateCount,
						deduplicatedAwardCount: result.retrieval.keyword.deduplicatedAwardCount
					},
					{
						id: `works-semantic:${result.retrieval.semantic.status}`,
						query: options.description,
						totalMatches: result.retrieval.semantic.totalWorkMatches,
						retrievedAwardCount: result.retrieval.semantic.hydratedAwardCount,
						candidateCount: result.retrieval.semantic.candidateCount,
						deduplicatedAwardCount: Math.max(
							0,
							result.retrieval.semantic.linkedAwardCount - result.retrieval.semantic.candidateCount
						)
					}
				],
				costUsd: result.meta.costUsd
			};
		}
	};
};

const createConditionalSemanticStrategy = ({
	fetch
}: {
	fetch?: typeof globalThis.fetch;
} = {}): CalibrationStrategy => {
	const keywordStrategy = createKeywordStrategy({ fetch });
	const combinedStrategy = createCombinedStrategy({ fetch });

	return {
		id: 'conditional-semantic',
		label: 'Semantic retrieval only for sparse or weak keyword results',
		search: async (options) => {
			const keywordResult = await keywordStrategy.search(options);
			const shouldUseSemantic =
				keywordResult.candidateCount < MIN_KEYWORD_CANDIDATES ||
				(keywordResult.funders[0]?.score.total ?? 0) < MIN_TOP_FUNDER_SCORE;

			if (!shouldUseSemantic) {
				return {
					...keywordResult,
					retrieval: keywordResult.retrieval.map((stage) => ({
						...stage,
						id: `${stage.id}:semantic-skipped`
					}))
				};
			}

			return combinedStrategy.search(options);
		}
	};
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const formatCost = (costUsd: number | null) =>
	costUsd === null ? 'unknown' : `$${costUsd.toFixed(6)}`;

const formatFunder = (funder: FunderMatch, rank: number) =>
	[
		`${rank}. ${funder.name}`,
		`score=${funder.score.total}`,
		`awards=${formatNumber(funder.matchingAwardCount)}`,
		`evidence=${formatNumber(funder.evidenceRecordCount)}`,
		`sources=${formatNumber(funder.sourceCount)}`
	].join(' | ');

const getDiscountedGain = (grades: number[]) =>
	grades.reduce((total, grade, index) => total + (2 ** grade - 1) / Math.log2(index + 2), 0);

const getRankingMetrics = ({
	funders,
	calibrationCase
}: {
	funders: FunderMatch[];
	calibrationCase: CalibrationCase;
}) => {
	const rankedGrades = funders
		.slice(0, TOP_FUNDER_LIMIT)
		.map((funder) => calibrationCase.judgments[funder.id] ?? 0);
	const idealGrades = Object.values(calibrationCase.judgments)
		.toSorted((left, right) => right - left)
		.slice(0, TOP_FUNDER_LIMIT);
	const idealGain = getDiscountedGain(idealGrades);
	const relevantCount = rankedGrades.filter((grade) => grade >= 2).length;

	return {
		ndcg: idealGain > 0 ? getDiscountedGain(rankedGrades) / idealGain : 0,
		precision: relevantCount / TOP_FUNDER_LIMIT,
		judged: rankedGrades.filter((grade) => grade > 0).length,
		grades: rankedGrades
	};
};

const formatRun = ({ calibrationCase, strategy, result, error }: CalibrationRun) => {
	const lines = [
		`case=${calibrationCase.id}`,
		`query="${calibrationCase.description}" country=${calibrationCase.countryCode} field="${calibrationCase.field}"`,
		`strategy=${strategy.id} label="${strategy.label}"`
	];

	if (!result) {
		return [...lines, `error="${error ?? 'Unknown error'}"`].join('\n');
	}

	lines.push(
		`summary candidates=${formatNumber(result.candidateCount)} funders=${formatNumber(result.funders.length)} cost=${formatCost(result.costUsd)}`
	);
	const metrics = getRankingMetrics({ funders: result.funders, calibrationCase });
	lines.push(
		`quality ndcg@${TOP_FUNDER_LIMIT}=${metrics.ndcg.toFixed(3)} precision@${TOP_FUNDER_LIMIT}=${metrics.precision.toFixed(3)} judged=${metrics.judged}/${TOP_FUNDER_LIMIT} grades=${metrics.grades.join(',')}`
	);

	for (const stage of result.retrieval) {
		lines.push(
			[
				`retrieval=${stage.id}`,
				`query="${stage.query ?? 'n/a'}"`,
				`matches=${formatNumber(stage.totalMatches)}`,
				`retrieved=${formatNumber(stage.retrievedAwardCount)}`,
				`candidates=${formatNumber(stage.candidateCount)}`,
				`deduplicated=${formatNumber(stage.deduplicatedAwardCount)}`
			].join(' ')
		);
	}

	const rankedFunders = result.funders.slice(0, TOP_FUNDER_LIMIT);

	lines.push(
		...(rankedFunders.length > 0
			? rankedFunders.flatMap((funder, index) => [
					formatFunder(funder, index + 1),
					...funder.representativeAwards
						.slice(0, 2)
						.map(
							(award) =>
								`   award=${JSON.stringify(award.candidate.title ?? 'Untitled award')} score=${award.score.total} countries=${award.candidate.countryCodes.join(',') || 'unknown'}`
						)
				])
			: ['ranked-funders=none'])
	);

	return lines.join('\n');
};

const toErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message.replaceAll('"', "'") : String(error);

const runCalibration = async ({
	cases = CALIBRATION_CASES,
	strategies = [createKeywordStrategy()]
}: {
	cases?: CalibrationCase[];
	strategies?: CalibrationStrategy[];
} = {}) => {
	const runs: CalibrationRun[] = [];

	for (const calibrationCase of cases) {
		for (const strategy of strategies) {
			try {
				const result = await strategy.search({
					description: calibrationCase.description,
					countryCode: calibrationCase.countryCode,
					field: calibrationCase.field,
					signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
				});

				runs.push({ calibrationCase, strategy, result, error: null });
			} catch (error) {
				runs.push({
					calibrationCase,
					strategy,
					result: null,
					error: toErrorMessage(error)
				});
			}
		}
	}

	return runs;
};

const formatStrategySummaries = (runs: CalibrationRun[]) => {
	const strategyIds = [...new Set(runs.map((run) => run.strategy.id))];

	return strategyIds.map((strategyId) => {
		const strategyRuns = runs.filter(
			(run) => run.strategy.id === strategyId && run.result !== null
		);
		const metrics = strategyRuns.map((run) =>
			getRankingMetrics({ funders: run.result!.funders, calibrationCase: run.calibrationCase })
		);
		const knownCosts = strategyRuns
			.map((run) => run.result!.costUsd)
			.filter((cost): cost is number => cost !== null);
		const average = (values: number[]) =>
			values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0;

		return [
			`strategy-summary=${strategyId}`,
			`cases=${strategyRuns.length}/${CALIBRATION_CASES.length}`,
			`mean-ndcg@${TOP_FUNDER_LIMIT}=${average(metrics.map((metric) => metric.ndcg)).toFixed(3)}`,
			`mean-precision@${TOP_FUNDER_LIMIT}=${average(metrics.map((metric) => metric.precision)).toFixed(3)}`,
			`total-cost=${knownCosts.length === strategyRuns.length ? formatCost(knownCosts.reduce((total, cost) => total + cost, 0)) : 'unknown'}`
		].join(' ');
	});
};

const main = async () => {
	const fetch = createSharedFetch();
	const strategies = [
		createKeywordStrategy({ fetch }),
		createCombinedStrategy({ fetch }),
		createConditionalSemanticStrategy({ fetch })
	];
	const runs = await runCalibration({ strategies });

	console.log(
		`Who Funds This? calibration | cases=${CALIBRATION_CASES.length} strategies=${strategies.length} top=${TOP_FUNDER_LIMIT}`
	);
	console.log(runs.map(formatRun).join('\n\n'));
	console.log(`\n${formatStrategySummaries(runs).join('\n')}`);

	if (runs.some((run) => run.error !== null)) {
		process.exitCode = 1;
	}
};

if (import.meta.main) {
	await main();
}

export {
	CALIBRATION_CASES,
	createCombinedStrategy,
	createConditionalSemanticStrategy,
	createKeywordStrategy,
	createSharedFetch,
	formatRun,
	formatStrategySummaries,
	runCalibration,
	getRankingMetrics,
	type CalibrationCase,
	type CalibrationRun,
	type CalibrationStrategy,
	type CalibrationStrategyResult,
	type RetrievalStage
};
