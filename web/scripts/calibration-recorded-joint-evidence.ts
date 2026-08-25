import {
	RECORDED_COMBINED_EVIDENCE,
	type RecordedFunderEvidence
} from './calibration-recorded-evidence';

type RecordedJointEvidence = {
	keyword: RecordedFunderEvidence[] | null;
	combined: RecordedFunderEvidence[] | null;
};

// The current recorded snapshots kept full funder evidence only for combined retrieval.
// Add keyword evidence here when the live calibration is recorded again; null deliberately
// prevents the joint evaluator from treating combined scores as keyword scores.
const RECORDED_KEYWORD_EVIDENCE: Record<string, RecordedFunderEvidence[]> = {};

const caseIds = new Set([
	...Object.keys(RECORDED_KEYWORD_EVIDENCE),
	...Object.keys(RECORDED_COMBINED_EVIDENCE)
]);

const RECORDED_JOINT_EVIDENCE = Object.fromEntries(
	[...caseIds].map((caseId) => [
		caseId,
		{
			keyword: RECORDED_KEYWORD_EVIDENCE[caseId] ?? null,
			combined: RECORDED_COMBINED_EVIDENCE[caseId] ?? null
		}
	])
) as Record<string, RecordedJointEvidence>;

export { RECORDED_JOINT_EVIDENCE, type RecordedFunderEvidence, type RecordedJointEvidence };
