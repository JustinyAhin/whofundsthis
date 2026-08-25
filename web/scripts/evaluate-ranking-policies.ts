import { CALIBRATION_CASES } from './calibration-cases';
import {
	RECORDED_COMBINED_EVIDENCE,
	type RecordedFunderEvidence
} from './calibration-recorded-evidence';

const TOP_FUNDER_LIMIT = 5;

type RankingPolicy = {
	titleWeight: number;
	supportWeight: number;
};

const tokenize = (value: string | null) =>
	new Set(
		(value ?? '')
			.toLocaleLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.split(/[^a-z0-9]+/)
			.filter((token) => token.length > 2)
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

const rank = ({ caseId, policy }: { caseId: string; policy: RankingPolicy }) => {
	const calibrationCase = CALIBRATION_CASES.find((value) => value.id === caseId);
	const evidence = RECORDED_COMBINED_EVIDENCE[caseId];

	if (!calibrationCase || !evidence) throw new Error(`Missing calibration evidence: ${caseId}`);

	return evidence.toSorted((left, right) => {
		const score = (value: RecordedFunderEvidence) =>
			value.score +
			getTitleOverlap({ description: calibrationCase.description, evidence: value }) *
				policy.titleWeight +
			Math.min(4, Math.max(0, Math.log2(value.awardCount + 1) - 1) * policy.supportWeight);

		return score(right) - score(left) || right.score - left.score;
	});
};

const getCaseNdcg = ({ caseId, policy }: { caseId: string; policy: RankingPolicy }) => {
	const calibrationCase = CALIBRATION_CASES.find((value) => value.id === caseId);

	if (!calibrationCase) throw new Error(`Unknown calibration case: ${caseId}`);

	const grades = rank({ caseId, policy })
		.slice(0, TOP_FUNDER_LIMIT)
		.map((funder) => calibrationCase.judgments[funder.id] ?? 0);
	const idealGrades = Object.values(calibrationCase.judgments)
		.toSorted((left, right) => right - left)
		.slice(0, TOP_FUNDER_LIMIT);

	return getDiscountedGain(grades) / getDiscountedGain(idealGrades);
};

const caseIds = CALIBRATION_CASES.map((value) => value.id);
const baselinePolicy = { titleWeight: 0, supportWeight: 0 };
const baselineByCase = new Map(
	caseIds.map((caseId) => [caseId, getCaseNdcg({ caseId, policy: baselinePolicy })])
);
const titleWeights = [0, 2, 4, 6, 8, 10, 12];
const supportWeights = [0, 0.5, 1, 1.5, 2];
const results = titleWeights.flatMap((titleWeight) =>
	supportWeights.map((supportWeight) => {
		const policy = { titleWeight, supportWeight };
		const ndcgByCase = caseIds.map((caseId) => getCaseNdcg({ caseId, policy }));

		return {
			policy,
			meanNdcg: ndcgByCase.reduce((total, value) => total + value, 0) / ndcgByCase.length,
			ndcgByCase,
			nonRegressing: ndcgByCase.every(
				(value, index) => value >= (baselineByCase.get(caseIds[index]) ?? 0)
			)
		};
	})
);
const accepted = results
	.filter((result) => result.nonRegressing && result.meanNdcg > results[0].meanNdcg)
	.toSorted(
		(left, right) =>
			right.meanNdcg - left.meanNdcg ||
			left.policy.titleWeight +
				left.policy.supportWeight -
				(right.policy.titleWeight + right.policy.supportWeight)
	);
const format = (result: (typeof results)[number]) =>
	[
		`title-weight=${result.policy.titleWeight}`,
		`support-weight=${result.policy.supportWeight}`,
		`mean-ndcg@${TOP_FUNDER_LIMIT}=${result.meanNdcg.toFixed(3)}`,
		`cases=${result.ndcgByCase.map((value) => value.toFixed(3)).join(',')}`
	].join(' ');

console.log(`baseline ${format(results[0])}`);
console.log('Non-regressing improvements');
console.log(accepted.length > 0 ? accepted.slice(0, 10).map(format).join('\n') : 'none');

if (accepted.length === 0) process.exitCode = 1;
