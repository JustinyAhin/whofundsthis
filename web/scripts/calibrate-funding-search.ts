import { buildOpenAlexSearch } from '../src/lib/server/awards/search-award-candidates';
import { createCombinedAwardCandidateSearchService } from '../src/lib/server/awards/search-combined-award-candidates';
import { createAwardCandidateSearchService } from '../src/lib/server/awards/search-award-candidates';
import { createSemanticAwardCandidateSearchService } from '../src/lib/server/awards/search-semantic-award-candidates';
import { aggregateFunders } from '../src/lib/server/funders/aggregate-funders';
import { createFunderMatchSearchService } from '../src/lib/server/funders/search-funder-matches';
import type { FunderMatch, SearchFunderMatchesOptions } from '../src/lib/server/funders/types';
import { createOpenAlexClient } from '../src/lib/server/openalex/client';
import { createSemanticWorksClient } from '../src/lib/server/openalex/semantic-works-client';
import { rankAwardCandidates } from '../src/lib/server/scoring/rank-award-candidates';

const TOP_FUNDER_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 30_000;

type CalibrationCase = {
	id: string;
	description: string;
	countryCode: string;
	field: string;
};

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

const CALIBRATION_CASES: CalibrationCase[] = [
	{
		id: 'pregnancy-malaria-vaccine',
		description: 'pregnancy malaria vaccine',
		countryCode: 'BJ',
		field: 'Medicine'
	},
	{
		id: 'climate-resilient-maize-farming',
		description: 'climate resilient maize farming',
		countryCode: 'NG',
		field: 'Agricultural and Biological Sciences'
	},
	{
		id: 'maternal-health-digital-interventions',
		description: 'maternal health digital interventions',
		countryCode: 'GH',
		field: 'Medicine'
	},
	{
		id: 'coastal-erosion-climate-adaptation',
		description: 'coastal erosion climate adaptation',
		countryCode: 'BJ',
		field: 'Environmental Science'
	},
	{
		id: 'machine-learning-crop-disease',
		description: 'machine learning crop disease',
		countryCode: 'KE',
		field: 'Computer Science'
	}
];

const createKeywordStrategy = (): CalibrationStrategy => {
	const service = createFunderMatchSearchService();

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

const createCombinedStrategy = (): CalibrationStrategy => {
	const service = createCombinedAwardCandidateSearchService({
		keywordSearchService: createAwardCandidateSearchService({ client: createOpenAlexClient() }),
		semanticSearchService: createSemanticAwardCandidateSearchService({
			client: createSemanticWorksClient()
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
				funders: aggregateFunders(rankedAwards),
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

	const rankedFunders = result.funders
		.toSorted(
			(left, right) =>
				right.score.total - left.score.total ||
				(left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
		)
		.slice(0, TOP_FUNDER_LIMIT);

	lines.push(
		...(rankedFunders.length > 0
			? rankedFunders.map((funder, index) => formatFunder(funder, index + 1))
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

const main = async () => {
	const strategies = [createKeywordStrategy(), createCombinedStrategy()];
	const runs = await runCalibration({ strategies });

	console.log(
		`Who Funds This? calibration | cases=${CALIBRATION_CASES.length} strategies=${strategies.length} top=${TOP_FUNDER_LIMIT}`
	);
	console.log(runs.map(formatRun).join('\n\n'));

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
	createKeywordStrategy,
	formatRun,
	runCalibration,
	type CalibrationCase,
	type CalibrationRun,
	type CalibrationStrategy,
	type CalibrationStrategyResult,
	type RetrievalStage
};
