import { CALIBRATION_CASES, type CalibrationCase } from './calibration-cases';
import {
	RECORDED_JOINT_EVIDENCE,
	type RecordedFunderEvidence
} from './calibration-recorded-joint-evidence';
import {
	RECORDED_CALIBRATION_RUNS,
	type RecordedStrategyResult
} from './calibration-recorded-runs';

const TOP_FUNDER_LIMIT = 5;
const TITLE_WEIGHTS = [0, 2, 4, 6, 8, 10, 12];
const CANDIDATE_THRESHOLDS = [0, 5, 10, 15, 20, 25, 30, 40, 50, 51];
const SCORE_THRESHOLDS = [0, 60, 65, 70, 72, 75, 80, 83];
const STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'as',
	'at',
	'by',
	'for',
	'from',
	'in',
	'into',
	'of',
	'on',
	'or',
	'the',
	'to',
	'using',
	'with'
]);

type StrategyId = 'keyword' | 'combined';

type JointPolicy = {
	titleWeight: number;
	candidateThreshold: number;
	scoreThreshold: number;
};

type JointCaseSnapshot = {
	calibrationCase: CalibrationCase;
	keyword: RecordedStrategyResult;
	combined: RecordedStrategyResult;
	evidence: {
		keyword: RecordedFunderEvidence[] | null;
		combined: RecordedFunderEvidence[] | null;
	};
};

type PolicyResult = {
	policy: JointPolicy;
	meanNdcg: number | null;
	meanPrecision: number | null;
	caseMetrics: Record<string, { ndcg: number; precision: number }>;
	totalCostUsd: number;
	semanticCaseCount: number;
	missingEvidence: Array<{ caseId: string; strategy: StrategyId }>;
};

const tokenize = (value: string | null) =>
	new Set(
		(value ?? '')
			.toLocaleLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.split(/[^a-z0-9]+/)
			.filter((token) => token.length > 2 && !STOP_WORDS.has(token))
	);

const getTitleOverlap = ({
	description,
	evidence
}: {
	description: string;
	evidence: RecordedFunderEvidence;
}) => {
	const queryTokens = tokenize(description);
	const titleTokens = tokenize(evidence.bestAwardTitle);

	return queryTokens.size > 0
		? [...queryTokens].filter((token) => titleTokens.has(token)).length / queryTokens.size
		: 0;
};

const getDiscountedGain = (grades: number[]) =>
	grades.reduce((total, grade, index) => total + (2 ** grade - 1) / Math.log2(index + 2), 0);

const average = (values: number[]) =>
	values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const getMetrics = ({
	calibrationCase,
	funderIds
}: {
	calibrationCase: CalibrationCase;
	funderIds: string[];
}) => {
	const grades = funderIds
		.slice(0, TOP_FUNDER_LIMIT)
		.map((funderId) => calibrationCase.judgments[funderId] ?? 0);
	const idealGrades = Object.values(calibrationCase.judgments)
		.toSorted((left, right) => right - left)
		.slice(0, TOP_FUNDER_LIMIT);
	const idealGain = getDiscountedGain(idealGrades);

	return {
		ndcg: idealGain > 0 ? getDiscountedGain(grades) / idealGain : 0,
		precision: grades.filter((grade) => grade >= 2).length / TOP_FUNDER_LIMIT
	};
};

const getSnapshots = () =>
	RECORDED_CALIBRATION_RUNS.flatMap((run): JointCaseSnapshot[] => {
		const calibrationCase = CALIBRATION_CASES.find((value) => value.id === run.caseId);

		if (!calibrationCase) return [];

		const evidence = RECORDED_JOINT_EVIDENCE[run.caseId];

		return [
			{
				calibrationCase,
				keyword: run.keyword,
				combined: run.combined,
				evidence: evidence ?? { keyword: null, combined: null }
			}
		];
	});

const selectStrategy = ({
	snapshot,
	policy
}: {
	snapshot: JointCaseSnapshot;
	policy: JointPolicy;
}): StrategyId =>
	snapshot.keyword.candidateCount < policy.candidateThreshold ||
	// Recorded calibration scores predate the title bonus, so this models the
	// production gate's unboosted 60/40 award-evidence score.
	snapshot.keyword.topFunderScore < policy.scoreThreshold
		? 'combined'
		: 'keyword';

const rank = ({
	description,
	result,
	evidence,
	titleWeight
}: {
	description: string;
	result: RecordedStrategyResult;
	evidence: RecordedFunderEvidence[] | null;
	titleWeight: number;
}) => {
	if (titleWeight === 0) return result.funderIds;
	if (!evidence) return null;

	const baselineRank = new Map(result.funderIds.map((funderId, index) => [funderId, index]));
	const evidenceRank = new Map(evidence.map((funder, index) => [funder.id, index]));
	const score = (funder: RecordedFunderEvidence) =>
		Math.min(
			100,
			Math.round(funder.score + getTitleOverlap({ description, evidence: funder }) * titleWeight)
		);
	const tieBreakRank = (funder: RecordedFunderEvidence) =>
		baselineRank.get(funder.id) ?? result.funderIds.length + (evidenceRank.get(funder.id) ?? 0);

	return evidence
		.toSorted(
			(left, right) => score(right) - score(left) || tieBreakRank(left) - tieBreakRank(right)
		)
		.map((funder) => funder.id);
};

const evaluatePolicy = ({
	snapshots,
	policy
}: {
	snapshots: JointCaseSnapshot[];
	policy: JointPolicy;
}): PolicyResult => {
	const metrics: Array<{ ndcg: number; precision: number }> = [];
	const caseMetrics: PolicyResult['caseMetrics'] = {};
	const missingEvidence: PolicyResult['missingEvidence'] = [];
	let totalCostUsd = 0;
	let semanticCaseCount = 0;

	for (const snapshot of snapshots) {
		const strategy = selectStrategy({ snapshot, policy });
		const result = snapshot[strategy];
		const funderIds = rank({
			description: snapshot.calibrationCase.description,
			result,
			evidence: snapshot.evidence[strategy],
			titleWeight: policy.titleWeight
		});

		totalCostUsd += result.costUsd;
		if (strategy === 'combined') semanticCaseCount += 1;

		if (!funderIds) {
			missingEvidence.push({ caseId: snapshot.calibrationCase.id, strategy });
			continue;
		}

		const caseMetric = getMetrics({ calibrationCase: snapshot.calibrationCase, funderIds });
		metrics.push(caseMetric);
		caseMetrics[snapshot.calibrationCase.id] = caseMetric;
	}

	const complete = missingEvidence.length === 0 && metrics.length === snapshots.length;

	return {
		policy,
		meanNdcg: complete ? average(metrics.map((metric) => metric.ndcg)) : null,
		meanPrecision: complete ? average(metrics.map((metric) => metric.precision)) : null,
		caseMetrics,
		totalCostUsd,
		semanticCaseCount,
		missingEvidence
	};
};

const formatPolicy = (result: PolicyResult, caseCount: number) => {
	const id = `title=${result.policy.titleWeight} candidates<${result.policy.candidateThreshold} evidence-score<${result.policy.scoreThreshold}`;

	if (result.meanNdcg === null || result.meanPrecision === null) {
		return `${id} not-evaluable missing=${result.missingEvidence.map(({ caseId, strategy }) => `${caseId}:${strategy}`).join(',')}`;
	}

	return [
		id,
		`mean-ndcg@${TOP_FUNDER_LIMIT}=${result.meanNdcg.toFixed(3)}`,
		`mean-precision@${TOP_FUNDER_LIMIT}=${result.meanPrecision.toFixed(3)}`,
		`cost=$${result.totalCostUsd.toFixed(6)}`,
		`semantic-cases=${result.semanticCaseCount}/${caseCount}`
	].join(' ');
};

const snapshots = getSnapshots();
const missingRunCaseIds = CALIBRATION_CASES.map((value) => value.id).filter(
	(caseId) => !RECORDED_CALIBRATION_RUNS.some((run) => run.caseId === caseId)
);
const policies = TITLE_WEIGHTS.flatMap((titleWeight) =>
	CANDIDATE_THRESHOLDS.flatMap((candidateThreshold) =>
		SCORE_THRESHOLDS.map((scoreThreshold) => ({
			titleWeight,
			candidateThreshold,
			scoreThreshold
		}))
	)
);
const results = policies.map((policy) => evaluatePolicy({ snapshots, policy }));
const currentWithoutTitle = results.find(
	(result) =>
		result.policy.titleWeight === 0 &&
		result.policy.candidateThreshold === 15 &&
		result.policy.scoreThreshold === 70
)!;
const currentWithTitle = results.find(
	(result) =>
		result.policy.titleWeight === 8 &&
		result.policy.candidateThreshold === 15 &&
		result.policy.scoreThreshold === 70
)!;
const completeConditionalResults = results.filter(
	(result) =>
		result.meanNdcg !== null &&
		result.meanPrecision !== null &&
		result.semanticCaseCount < snapshots.length
);
const alwaysCombinedByTitleWeight = TITLE_WEIGHTS.map((titleWeight) =>
	evaluatePolicy({
		snapshots,
		policy: { titleWeight, candidateThreshold: 51, scoreThreshold: 83 }
	})
);
const combinedBaselineByTitleWeight = new Map(
	alwaysCombinedByTitleWeight.map((result) => [result.policy.titleWeight, result])
);
const combinedWithoutTitle = combinedBaselineByTitleWeight.get(0)!;
const getRegressedCaseIds = (result: PolicyResult) =>
	Object.entries(result.caseMetrics)
		.filter(([caseId, metric]) => {
			const baselineMetric = combinedWithoutTitle.caseMetrics[caseId];

			return (
				baselineMetric &&
				(metric.ndcg < baselineMetric.ndcg || metric.precision < baselineMetric.precision)
			);
		})
		.map(([caseId]) => caseId);
const nonRegressingConditional = completeConditionalResults
	.filter((result) => {
		const baseline = combinedBaselineByTitleWeight.get(result.policy.titleWeight);

		return (
			baseline?.meanNdcg !== null &&
			baseline?.meanPrecision !== null &&
			result.meanNdcg! >= baseline.meanNdcg! &&
			result.meanPrecision! >= baseline.meanPrecision!
		);
	})
	.toSorted(
		(left, right) => left.totalCostUsd - right.totalCostUsd || right.meanNdcg! - left.meanNdcg!
	);
const keywordEvidenceCount = snapshots.filter((snapshot) => snapshot.evidence.keyword).length;
const combinedEvidenceCount = snapshots.filter((snapshot) => snapshot.evidence.combined).length;

console.log('Joint adaptive-threshold and title-weight evaluation');
console.log('semantic-gate=keyword candidate count plus unboosted funder evidence score');
console.log(
	`snapshot-coverage recorded-runs=${snapshots.length}/${CALIBRATION_CASES.length} keyword-rankable=${keywordEvidenceCount}/${snapshots.length} combined-rankable=${combinedEvidenceCount}/${snapshots.length}`
);
if (missingRunCaseIds.length > 0)
	console.log(`missing-recorded-runs=${missingRunCaseIds.join(',')}`);
console.log('Current adaptive policy');
console.log(formatPolicy(currentWithoutTitle, snapshots.length));
console.log(formatPolicy(currentWithTitle, snapshots.length));
console.log('Always-combined title-weight sensitivity');
console.log(
	alwaysCombinedByTitleWeight
		.filter((result) => [0, 6, 8, 10, 12].includes(result.policy.titleWeight))
		.map((result) => {
			const regressedCaseIds = getRegressedCaseIds(result);

			return `${formatPolicy(result, snapshots.length)} case-regressions=${regressedCaseIds.join(',') || 'none'}`;
		})
		.join('\n')
);
console.log(
	'Lowest-cost conditional policies that match their same-title always-combined baseline'
);
console.log(
	nonRegressingConditional.length > 0
		? nonRegressingConditional
				.slice(0, 10)
				.map((result) => formatPolicy(result, snapshots.length))
				.join('\n')
		: 'none fully evaluable'
);

if (keywordEvidenceCount < snapshots.length) {
	console.log(
		'limitation=Nonzero title weights cannot be evaluated for cost-saving conditional policies until each keyword snapshot records every ranked funder base score and best award title.'
	);
}

export { evaluatePolicy, getTitleOverlap, rank, selectStrategy, type JointPolicy };
