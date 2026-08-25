import type { AwardCandidate } from '$lib/server/awards/types';

import type { AwardScoreBreakdown, AwardScoringContext, ScoreDimension } from './types';

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

const BASE_WEIGHTS = {
	textRelevance: 0.4,
	topicOverlap: 0.2,
	geography: 0.15,
	recency: 0.15,
	metadataConfidence: 0.1
} as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const tokenize = (value: string | null | undefined) =>
	new Set(
		(value ?? '')
			.toLocaleLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.split(/[^a-z0-9]+/)
			.filter((token) => token.length > 2 && !STOP_WORDS.has(token))
	);

const getOverlap = ({ query, candidate }: { query: Set<string>; candidate: Set<string> }) => {
	if (query.size === 0) return 0;
	const matches = [...query].filter((token) => candidate.has(token));
	return matches.length / query.size;
};

const getMatchedTokens = ({ query, candidate }: { query: Set<string>; candidate: Set<string> }) =>
	[...query].filter((token) => candidate.has(token));

const createDimension = ({
	score,
	weight,
	explanation,
	evidence = []
}: {
	score: number;
	weight: number;
	explanation: string;
	evidence?: string[];
}): ScoreDimension => {
	const normalizedScore = clamp(score);

	return {
		score: normalizedScore,
		weight,
		contribution: normalizedScore * weight,
		explanation,
		evidence
	};
};

const scoreTextRelevance = ({
	candidate,
	context,
	weight
}: {
	candidate: AwardCandidate;
	context: AwardScoringContext;
	weight: number;
}) => {
	const queryTokens = tokenize(context.description);
	const titleTokens = tokenize(candidate.title);
	const descriptionTokens = tokenize(candidate.description);
	const allCandidateTokens = new Set([...titleTokens, ...descriptionTokens]);
	const titleOverlap = getOverlap({ query: queryTokens, candidate: titleTokens });
	const bodyOverlap = getOverlap({ query: queryTokens, candidate: allCandidateTokens });
	const maxRelevance = context.maxOpenAlexRelevance ?? candidate.relevanceScore ?? 0;
	const openAlexRelevance = maxRelevance
		? clamp((candidate.relevanceScore ?? 0) / maxRelevance)
		: 0;
	const score = openAlexRelevance * 0.55 + bodyOverlap * 0.3 + titleOverlap * 0.15;
	const matchedTokens = getMatchedTokens({ query: queryTokens, candidate: allCandidateTokens });

	return createDimension({
		score,
		weight,
		explanation:
			matchedTokens.length > 0
				? `Matches ${matchedTokens.length} important term${matchedTokens.length === 1 ? '' : 's'} from the research description.`
				: 'OpenAlex found this award relevant, but its available text has limited direct term overlap.',
		evidence: matchedTokens.slice(0, 6)
	});
};

const scoreTopicOverlap = ({
	candidate,
	context,
	weight
}: {
	candidate: AwardCandidate;
	context: AwardScoringContext;
	weight: number;
}) => {
	if (candidate.topics.length === 0) {
		return createDimension({
			score: 0.35,
			weight,
			explanation: 'No OpenAlex topic classification is available for this award.'
		});
	}

	const queryTokens = tokenize([context.description, context.field].filter(Boolean).join(' '));
	const normalizedField = context.field?.toLocaleLowerCase() ?? null;
	const topicScores = candidate.topics.map((topic) => {
		const labels = [topic.name, topic.subfield.name, topic.field.name, topic.domain.name].join(' ');
		const labelTokens = tokenize(labels);
		const termOverlap = getOverlap({ query: queryTokens, candidate: labelTokens });
		const fieldMatch = normalizedField
			? [topic.field.name, topic.domain.name].some((label) => {
					const normalizedLabel = label.toLocaleLowerCase();
					return (
						normalizedLabel.includes(normalizedField) || normalizedField.includes(normalizedLabel)
					);
				})
				? 1
				: 0
			: 0;
		const semanticMatch = Math.max(termOverlap, fieldMatch);

		return {
			topic,
			score: semanticMatch * 0.7 + topic.score * 0.3,
			matchedTokens: getMatchedTokens({ query: queryTokens, candidate: labelTokens })
		};
	});
	const best = topicScores.sort((left, right) => right.score - left.score)[0];

	return createDimension({
		score: best.score,
		weight,
		explanation: `Closest OpenAlex topic: ${best.topic.name}.`,
		evidence: [best.topic.field.name, best.topic.subfield.name, ...best.matchedTokens.slice(0, 3)]
	});
};

const scoreGeography = ({
	candidate,
	context,
	weight
}: {
	candidate: AwardCandidate;
	context: AwardScoringContext;
	weight: number;
}) => {
	if (!context.countryCode) {
		return createDimension({
			score: 0,
			weight: 0,
			explanation: 'No applicant country was supplied, so geography is not scored.'
		});
	}

	if (candidate.countryCodes.includes(context.countryCode)) {
		return createDimension({
			score: 1,
			weight,
			explanation: `OpenAlex links this award to an institution in ${context.countryCode}.`,
			evidence: candidate.institutions
				.filter((institution) => institution.countryCode === context.countryCode)
				.map((institution) => institution.name)
				.slice(0, 3)
		});
	}

	if (candidate.countryCodes.length === 0) {
		return createDimension({
			score: 0.5,
			weight,
			explanation: 'Award geography is missing, so the country signal remains neutral.'
		});
	}

	return createDimension({
		score: 0.25,
		weight,
		explanation: `Recorded award institutions are outside ${context.countryCode}; this does not determine eligibility.`,
		evidence: candidate.countryCodes
	});
};

const scoreRecency = ({
	candidate,
	context,
	weight
}: {
	candidate: AwardCandidate;
	context: AwardScoringContext;
	weight: number;
}) => {
	const referenceYear = context.referenceYear ?? new Date().getUTCFullYear();
	const relevantYear = candidate.period.endYear ?? candidate.period.startYear;

	if (!relevantYear) {
		return createDimension({
			score: 0.4,
			weight,
			explanation: 'Award dates are missing, so recency is treated as uncertain.'
		});
	}

	if ((candidate.period.endYear ?? relevantYear) >= referenceYear) {
		return createDimension({
			score: 1,
			weight,
			explanation: `The recorded award period is active in or beyond ${referenceYear}.`,
			evidence: [
				String(candidate.period.startYear ?? relevantYear),
				String(candidate.period.endYear ?? relevantYear)
			]
		});
	}

	const age = Math.max(0, referenceYear - relevantYear);
	const score = Math.max(0.15, 0.5 ** (age / 10));

	return createDimension({
		score,
		weight,
		explanation: `The most recent recorded award year is ${relevantYear}.`,
		evidence: [String(relevantYear)]
	});
};

const scoreMetadataConfidence = ({
	candidate,
	weight
}: {
	candidate: AwardCandidate;
	weight: number;
}) =>
	createDimension({
		score: candidate.metadata.coverage,
		weight,
		explanation: `${candidate.metadata.availableFieldCount} of ${candidate.metadata.totalFieldCount} evidence fields are available.`,
		evidence: Object.entries(candidate.metadata.presence)
			.filter(([, present]) => present)
			.map(([field]) => field)
	});

const scoreAwardCandidate = ({
	candidate,
	context
}: {
	candidate: AwardCandidate;
	context: AwardScoringContext;
}): AwardScoreBreakdown => {
	const dimensions = {
		textRelevance: scoreTextRelevance({
			candidate,
			context,
			weight: BASE_WEIGHTS.textRelevance
		}),
		topicOverlap: scoreTopicOverlap({
			candidate,
			context,
			weight: BASE_WEIGHTS.topicOverlap
		}),
		geography: scoreGeography({
			candidate,
			context,
			weight: BASE_WEIGHTS.geography
		}),
		recency: scoreRecency({ candidate, context, weight: BASE_WEIGHTS.recency }),
		metadataConfidence: scoreMetadataConfidence({
			candidate,
			weight: BASE_WEIGHTS.metadataConfidence
		})
	};
	const activeWeight = Object.values(dimensions).reduce(
		(total, dimension) => total + dimension.weight,
		0
	);
	const weightedScore = Object.values(dimensions).reduce(
		(total, dimension) => total + dimension.contribution,
		0
	);

	return {
		total: Math.round((weightedScore / activeWeight) * 100),
		dimensions
	};
};

export { BASE_WEIGHTS, scoreAwardCandidate, tokenize };
