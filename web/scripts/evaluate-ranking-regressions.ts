import { RANKING_REGRESSION_CASES } from './ranking-regression-cases';

const TOP_FUNDER_LIMIT = 5;

const getDiscountedGain = (grades: number[]) =>
	grades.reduce((total, grade, index) => total + (2 ** grade - 1) / Math.log2(index + 2), 0);

const getMetrics = ({
	funderIds,
	judgments
}: {
	funderIds: string[];
	judgments: Record<string, number>;
}) => {
	const grades = funderIds.slice(0, TOP_FUNDER_LIMIT).map((funderId) => judgments[funderId] ?? 0);
	const idealGrades = Object.values(judgments)
		.toSorted((left, right) => right - left)
		.slice(0, TOP_FUNDER_LIMIT);

	return {
		ndcg: getDiscountedGain(grades) / getDiscountedGain(idealGrades),
		precision: grades.filter((grade) => grade >= 2).length / TOP_FUNDER_LIMIT
	};
};

for (const regressionCase of RANKING_REGRESSION_CASES) {
	const failure = regressionCase.verboseTitleFailure;
	const failureRank = regressionCase.observedKeyword.funderIds.indexOf(failure.funderId) + 1;
	const recordedGrade = regressionCase.judgments[failure.funderId];

	if (failureRank === 0) throw new Error(`${regressionCase.id}: failure funder is not recorded`);
	if (recordedGrade !== failure.expectedGrade) {
		throw new Error(`${regressionCase.id}: failure funder judgment changed`);
	}
	if (failure.observedTitleLength < 1000) {
		throw new Error(`${regressionCase.id}: fixture no longer represents a verbose award title`);
	}
	if (failure.observedFunderScore <= failure.observedAwardScore) {
		throw new Error(`${regressionCase.id}: recorded title boost is missing`);
	}
	if (failure.normalizedFunderScore >= failure.observedFunderScore) {
		throw new Error(`${regressionCase.id}: verbose title was not discounted`);
	}

	const keywordMetrics = getMetrics({
		funderIds: regressionCase.observedKeyword.funderIds,
		judgments: regressionCase.judgments
	});
	const combinedMetrics = getMetrics({
		funderIds: regressionCase.observedCombined.funderIds,
		judgments: regressionCase.judgments
	});
	const combinedFailureRank =
		regressionCase.observedCombined.funderIds.indexOf(failure.funderId) + 1;

	if (combinedMetrics.ndcg <= keywordMetrics.ndcg) {
		throw new Error(`${regressionCase.id}: combined policy did not improve nDCG`);
	}
	if (combinedMetrics.precision < keywordMetrics.precision) {
		throw new Error(`${regressionCase.id}: combined policy regressed precision`);
	}

	console.log(
		[
			`case=${regressionCase.id}`,
			`keyword-ndcg@${TOP_FUNDER_LIMIT}=${keywordMetrics.ndcg.toFixed(3)}`,
			`combined-ndcg@${TOP_FUNDER_LIMIT}=${combinedMetrics.ndcg.toFixed(3)}`,
			`keyword-precision@${TOP_FUNDER_LIMIT}=${keywordMetrics.precision.toFixed(3)}`,
			`combined-precision@${TOP_FUNDER_LIMIT}=${combinedMetrics.precision.toFixed(3)}`,
			`verbose-title-funder=${failure.funderId}`,
			`keyword-rank=${failureRank}`,
			`combined-rank=${combinedFailureRank}`,
			`grade=${recordedGrade}`,
			`award-score=${failure.observedAwardScore}`,
			`funder-score=${failure.observedFunderScore}`,
			`normalized-funder-score=${failure.normalizedFunderScore}`,
			`title-length=${failure.observedTitleLength}`,
			`matched-terms=${failure.matchedTerms.join(',')}`
		].join(' ')
	);
}
