import type { ScoredAwardCandidate } from '$lib/server/scoring/types';

import type { FunderDimensionSummary, FunderMatch, FundingRange } from './types';

const REPRESENTATIVE_AWARD_LIMIT = 3;
const AGGREGATE_AWARD_LIMIT = 3;
const TITLE_EVIDENCE_MAX_POINTS = 8;
const TITLE_EVIDENCE_FULL_CREDIT_TERM_LIMIT = 24;
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

const unique = (values: (string | null | undefined)[]) => [
	...new Set(values.filter((value): value is string => Boolean(value)))
];

const average = (values: number[]) =>
	values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const tokenize = (value: string | null | undefined) =>
	new Set(
		(value ?? '')
			.toLocaleLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.split(/[^a-z0-9]+/)
			.filter((token) => token.length > 2 && !STOP_WORDS.has(token))
	);

const getTitleEvidence = ({
	description,
	bestAward
}: {
	description: string;
	bestAward: ScoredAwardCandidate;
}) => {
	const queryTerms = tokenize(description);
	const titleTerms = tokenize(bestAward.candidate.title);
	const matchedTerms = [...queryTerms].filter((term) => titleTerms.has(term));
	const coverage = queryTerms.size > 0 ? matchedTerms.length / queryTerms.size : 0;
	const lengthPenalty =
		titleTerms.size > TITLE_EVIDENCE_FULL_CREDIT_TERM_LIMIT
			? TITLE_EVIDENCE_FULL_CREDIT_TERM_LIMIT / titleTerms.size
			: 1;
	const score = coverage * lengthPenalty;

	return {
		score,
		contribution: score * TITLE_EVIDENCE_MAX_POINTS,
		matchedTerms
	};
};

const getGeographyEvidence = (awards: ScoredAwardCandidate[]) => {
	const evaluatedAwards = awards.filter((award) => award.score.dimensions.geography.weight > 0);
	const matchedAwardCount = evaluatedAwards.filter(
		(award) => award.score.dimensions.geography.score === 1
	).length;
	const outsideAwardCount = evaluatedAwards.filter(
		(award) => award.score.dimensions.geography.score === 0.25
	).length;
	const missingAwardCount = evaluatedAwards.length - matchedAwardCount - outsideAwardCount;
	const status =
		evaluatedAwards.length === 0
			? 'not-requested'
			: matchedAwardCount > 0 && outsideAwardCount > 0
				? 'mixed'
				: matchedAwardCount > 0
					? 'matched'
					: outsideAwardCount > 0
						? 'outside'
						: 'missing';

	return {
		status,
		matchedAwardCount,
		outsideAwardCount,
		missingAwardCount
	} as const;
};

const aggregateDimensions = (awards: ScoredAwardCandidate[]): FunderDimensionSummary => ({
	textRelevance: average(awards.map((award) => award.score.dimensions.textRelevance.score)),
	topicOverlap: average(awards.map((award) => award.score.dimensions.topicOverlap.score)),
	geography: average(
		awards
			.filter((award) => award.score.dimensions.geography.weight > 0)
			.map((award) => award.score.dimensions.geography.score)
	),
	recency: average(awards.map((award) => award.score.dimensions.recency.score)),
	metadataConfidence: average(
		awards.map((award) => award.score.dimensions.metadataConfidence.score)
	)
});

const aggregateFundingRanges = (awards: ScoredAwardCandidate[]): FundingRange[] => {
	const amountsByCurrency = new Map<string, number[]>();
	const seenSources = new Set<string>();

	for (const { candidate } of awards) {
		for (const source of candidate.sources) {
			if (seenSources.has(source.openAlexId) || source.amount === null || !source.currency)
				continue;
			seenSources.add(source.openAlexId);
			const amounts = amountsByCurrency.get(source.currency) ?? [];
			amounts.push(source.amount);
			amountsByCurrency.set(source.currency, amounts);
		}
	}

	return [...amountsByCurrency.entries()]
		.map(([currency, amounts]) => ({
			currency,
			minimum: Math.min(...amounts),
			maximum: Math.max(...amounts),
			awardCount: amounts.length
		}))
		.sort((left, right) => right.awardCount - left.awardCount);
};

const getWhyThisFunder = ({
	awards,
	titleEvidence
}: {
	awards: ScoredAwardCandidate[];
	titleEvidence: ReturnType<typeof getTitleEvidence>;
}) => {
	const bestAward = awards[0];
	const dimensions = Object.entries(bestAward.score.dimensions)
		.filter(
			([name, dimension]) =>
				name !== 'metadataConfidence' &&
				dimension.weight > 0 &&
				dimension.score >= 0.5 &&
				(name !== 'geography' || dimension.score >= 0.75)
		)
		.map(([, dimension]) => dimension)
		.sort((left, right) => right.score - left.score);
	const reasons = unique(dimensions.slice(0, 2).map((dimension) => dimension.explanation));

	if (titleEvidence.matchedTerms.length > 0) {
		reasons.unshift(
			`Best award title matches ${titleEvidence.matchedTerms.length} important research term${titleEvidence.matchedTerms.length === 1 ? '' : 's'}: ${titleEvidence.matchedTerms.join(', ')}.`
		);
	}

	if (awards.length > 1) {
		reasons.push(`${awards.length} distinct matching award records support this funder match.`);
	}

	if (reasons.length === 0) {
		reasons.push('This funder appears in OpenAlex awards matching the research description.');
	}

	return reasons.slice(0, 3);
};

const aggregateFunder = ({
	awards,
	description
}: {
	awards: ScoredAwardCandidate[];
	description: string;
}): FunderMatch => {
	const sortedAwards = [...awards].sort((left, right) => right.score.total - left.score.total);
	const aggregateAwards = sortedAwards.slice(0, AGGREGATE_AWARD_LIMIT);
	const bestCandidate = sortedAwards[0].candidate;
	const funder = bestCandidate.funder!;
	const years = sortedAwards.flatMap(({ candidate }) =>
		[candidate.period.startYear, candidate.period.endYear].filter(
			(year): year is number => year !== null
		)
	);
	const outputIds = new Set(
		sortedAwards.flatMap(({ candidate }) => candidate.outputs.map((output) => output.id))
	);
	const sourceIds = new Set(
		sortedAwards.flatMap(({ candidate }) => candidate.sources.map((source) => source.openAlexId))
	);
	const averageTopScore = average(aggregateAwards.map((award) => award.score.total));
	const titleEvidence = getTitleEvidence({ description, bestAward: sortedAwards[0] });
	const geographyEvidence = getGeographyEvidence(sortedAwards);
	const evidenceScore = sortedAwards[0].score.total * 0.6 + averageTopScore * 0.4;

	return {
		id: funder.id,
		name: funder.name,
		doi: funder.doi,
		doiUrl: funder.doiUrl,
		score: {
			total: Math.min(100, Math.round(evidenceScore + titleEvidence.contribution)),
			bestAward: sortedAwards[0].score.total,
			titleEvidence,
			geographyEvidence,
			dimensions: aggregateDimensions(aggregateAwards)
		},
		matchingAwardCount: sortedAwards.length,
		evidenceRecordCount: sortedAwards.reduce(
			(total, award) => total + award.candidate.continuation.recordCount,
			0
		),
		representativeAwards: sortedAwards.slice(0, REPRESENTATIVE_AWARD_LIMIT),
		whyThisFunder: getWhyThisFunder({ awards: sortedAwards, titleEvidence }),
		countries: unique(sortedAwards.flatMap(({ candidate }) => candidate.countryCodes)).sort(),
		institutions: unique(
			sortedAwards.flatMap(({ candidate }) =>
				candidate.institutions.map((institution) => institution.name)
			)
		).sort(),
		investigators: unique(
			sortedAwards.flatMap(({ candidate }) =>
				candidate.investigators.map((investigator) => investigator.name)
			)
		).sort(),
		schemes: unique(sortedAwards.map(({ candidate }) => candidate.funding.scheme)).sort(),
		fundingRanges: aggregateFundingRanges(sortedAwards),
		awardYearRange: {
			minimum: years.length > 0 ? Math.min(...years) : null,
			maximum: years.length > 0 ? Math.max(...years) : null
		},
		fundedOutputsCount: outputIds.size,
		sourceCount: sourceIds.size
	};
};

const aggregateFunders = ({
	awards,
	description
}: {
	awards: ScoredAwardCandidate[];
	description: string;
}) => {
	const awardsByFunder = new Map<string, ScoredAwardCandidate[]>();

	for (const award of awards) {
		if (!award.candidate.funder) continue;
		const funderAwards = awardsByFunder.get(award.candidate.funder.id) ?? [];
		funderAwards.push(award);
		awardsByFunder.set(award.candidate.funder.id, funderAwards);
	}

	return [...awardsByFunder.values()]
		.map((awards) => aggregateFunder({ awards, description }))
		.sort((left, right) => right.score.total - left.score.total);
};

export { aggregateFunders, getGeographyEvidence, getTitleEvidence };
