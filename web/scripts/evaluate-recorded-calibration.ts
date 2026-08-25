import { CALIBRATION_CASES } from './calibration-cases';
import {
	RECORDED_CALIBRATION_RUNS,
	type RecordedStrategyResult
} from './calibration-recorded-runs';

const TOP_FUNDER_LIMIT = 5;

const getDiscountedGain = (grades: number[]) =>
	grades.reduce((total, grade, index) => total + (2 ** grade - 1) / Math.log2(index + 2), 0);

const getMetrics = ({ caseId, result }: { caseId: string; result: RecordedStrategyResult }) => {
	const calibrationCase = CALIBRATION_CASES.find((value) => value.id === caseId);

	if (!calibrationCase) throw new Error(`Unknown calibration case: ${caseId}`);

	const grades = result.funderIds
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

const average = (values: number[]) =>
	values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const evaluate = ({
	id,
	select
}: {
	id: string;
	select: (run: (typeof RECORDED_CALIBRATION_RUNS)[number]) => RecordedStrategyResult;
}) => {
	const selected = RECORDED_CALIBRATION_RUNS.map((run) => ({ run, result: select(run) }));
	const metrics = selected.map(({ run, result }) => getMetrics({ caseId: run.caseId, result }));

	return {
		id,
		meanNdcg: average(metrics.map((metric) => metric.ndcg)),
		meanPrecision: average(metrics.map((metric) => metric.precision)),
		totalCostUsd: selected.reduce((total, value) => total + value.result.costUsd, 0),
		semanticCaseCount: selected.filter(({ run, result }) => result === run.combined).length
	};
};

const keyword = evaluate({ id: 'keyword', select: (run) => run.keyword });
const combined = evaluate({ id: 'combined', select: (run) => run.combined });
const candidates = [0, 5, 10, 15, 20, 25, 30, 40, 50];
const scores = [0, 60, 65, 70, 72, 75, 80];
const conditional = candidates.flatMap((candidateThreshold) =>
	scores.map((scoreThreshold) =>
		evaluate({
			id: `conditional:candidates<${candidateThreshold}:score<${scoreThreshold}`,
			select: (run) =>
				run.keyword.candidateCount < candidateThreshold ||
				run.keyword.topFunderScore < scoreThreshold
					? run.combined
					: run.keyword
		})
	)
);
const nonRegressing = conditional
	.filter(
		(result) =>
			result.meanNdcg >= combined.meanNdcg && result.meanPrecision >= combined.meanPrecision
	)
	.toSorted(
		(left, right) => left.totalCostUsd - right.totalCostUsd || right.meanNdcg - left.meanNdcg
	);

const format = (result: ReturnType<typeof evaluate>) =>
	[
		result.id,
		`mean-ndcg@${TOP_FUNDER_LIMIT}=${result.meanNdcg.toFixed(3)}`,
		`mean-precision@${TOP_FUNDER_LIMIT}=${result.meanPrecision.toFixed(3)}`,
		`cost=$${result.totalCostUsd.toFixed(6)}`,
		`semantic-cases=${result.semanticCaseCount}/${RECORDED_CALIBRATION_RUNS.length}`
	].join(' ');

console.log('Recorded live calibration comparison');
console.log(format(keyword));
console.log(format(combined));
console.log('Non-regressing conditional policies, lowest cost first');
console.log(nonRegressing.slice(0, 10).map(format).join('\n'));

if (nonRegressing.length === 0) process.exitCode = 1;
