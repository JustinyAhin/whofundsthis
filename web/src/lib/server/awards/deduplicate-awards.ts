import { calculateAwardMetadata, normalizeText } from './normalize-award';
import type {
	AwardCandidate,
	AwardInstitution,
	AwardInvestigator,
	AwardOutput,
	AwardSourceRecord,
	AwardTopic
} from './types';

const normalizeKeyPart = (value: string | null | undefined) =>
	normalizeText(value)
		?.toLocaleLowerCase()
		.replace(/[^a-z0-9]+/g, '') ?? '';

const canonicalizeFunderAwardId = (value: string) => {
	const compact = value.toLocaleLowerCase().replace(/\s+/g, '');
	const withoutPeriod = compact.replace(/[-_/](?:(?:year|yr)[-_/]?)?\d{1,2}[a-z]?\d?$/i, '');
	const looksLikeNihProjectNumber = /^[1-9](?:(?:[a-z]\d{2})|[a-z]{3})[a-z]{2}\d{6}$/i;

	return looksLikeNihProjectNumber.test(withoutPeriod) ? withoutPeriod.slice(1) : withoutPeriod;
};

const getContinuationKey = (candidate: AwardCandidate) => {
	if (!candidate.funderAwardId) {
		return `openalex:${candidate.id}`;
	}

	const funder = candidate.funder?.id ?? normalizeKeyPart(candidate.funder?.name);
	const title = normalizeKeyPart(candidate.title);
	const awardId = canonicalizeFunderAwardId(candidate.funderAwardId);

	if (!funder || !awardId) {
		return `openalex:${candidate.id}`;
	}

	return `funder-award:${funder}:${awardId}:${title}`;
};

const mergeByKey = <T>({
	left,
	right,
	getKey,
	merge
}: {
	left: T[];
	right: T[];
	getKey: (value: T) => string;
	merge?: (current: T, incoming: T) => T;
}) => {
	const values = new Map<string, T>();

	for (const value of [...left, ...right]) {
		const key = getKey(value);
		const current = values.get(key);
		values.set(key, current && merge ? merge(current, value) : value);
	}

	return [...values.values()];
};

const mergeTopics = ({ left, right }: { left: AwardTopic[]; right: AwardTopic[] }) =>
	mergeByKey({
		left,
		right,
		getKey: (topic) => topic.id,
		merge: (current, incoming) => (incoming.score > current.score ? incoming : current)
	}).sort((leftTopic, rightTopic) => rightTopic.score - leftTopic.score);

const mergeInstitutions = ({
	left,
	right
}: {
	left: AwardInstitution[];
	right: AwardInstitution[];
}) => mergeByKey({ left, right, getKey: (institution) => institution.id });

const getInvestigatorKey = (investigator: AwardInvestigator) =>
	investigator.orcid ??
	[
		investigator.name,
		investigator.affiliation?.name,
		investigator.affiliation?.country,
		investigator.roleStart
	]
		.filter(Boolean)
		.join(':')
		.toLocaleLowerCase();

const mergeInvestigators = ({
	left,
	right
}: {
	left: AwardInvestigator[];
	right: AwardInvestigator[];
}) =>
	mergeByKey({
		left,
		right,
		getKey: getInvestigatorKey,
		merge: (current, incoming) => ({
			...current,
			roles: [...new Set([...current.roles, ...incoming.roles])]
		})
	});

const mergeOutputs = ({ left, right }: { left: AwardOutput[]; right: AwardOutput[] }) =>
	mergeByKey({ left, right, getKey: (output) => output.id });

const mergeSources = ({ left, right }: { left: AwardSourceRecord[]; right: AwardSourceRecord[] }) =>
	mergeByKey({ left, right, getKey: (source) => source.openAlexId });

const getLatestUpdate = (candidate: AwardCandidate) =>
	Math.max(...candidate.sources.map((source) => Date.parse(source.updatedDate ?? '') || 0), 0);

const selectRepresentative = ({ left, right }: { left: AwardCandidate; right: AwardCandidate }) => {
	const coverageDifference = right.metadata.coverage - left.metadata.coverage;

	if (coverageDifference !== 0) {
		return coverageDifference > 0 ? right : left;
	}

	const relevanceDifference = (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0);

	if (relevanceDifference !== 0) {
		return relevanceDifference > 0 ? right : left;
	}

	return getLatestUpdate(right) > getLatestUpdate(left) ? right : left;
};

const earliest = <T extends string | number>(left: T | null, right: T | null) => {
	if (left === null) return right;
	if (right === null) return left;
	return left < right ? left : right;
};

const latest = <T extends string | number>(left: T | null, right: T | null) => {
	if (left === null) return right;
	if (right === null) return left;
	return left > right ? left : right;
};

const mergeAwardCandidates = ({
	left,
	right
}: {
	left: AwardCandidate;
	right: AwardCandidate;
}): AwardCandidate => {
	const representative = selectRepresentative({ left, right });
	const alternative = representative === left ? right : left;
	const institutions = mergeInstitutions({ left: left.institutions, right: right.institutions });
	const outputs = mergeOutputs({ left: left.outputs, right: right.outputs });
	const sources = mergeSources({ left: left.sources, right: right.sources });
	const baseCandidate: Omit<AwardCandidate, 'metadata'> = {
		...representative,
		title: representative.title ?? alternative.title,
		description: representative.description ?? alternative.description,
		funderAwardId: representative.funderAwardId ?? alternative.funderAwardId,
		funder: representative.funder ?? alternative.funder,
		funding: {
			amount: representative.funding.amount ?? alternative.funding.amount,
			currency: representative.funding.currency ?? alternative.funding.currency,
			type: representative.funding.type ?? alternative.funding.type,
			scheme: representative.funding.scheme ?? alternative.funding.scheme
		},
		period: {
			startDate: earliest(left.period.startDate, right.period.startDate),
			endDate: latest(left.period.endDate, right.period.endDate),
			startYear: earliest(left.period.startYear, right.period.startYear),
			endYear: latest(left.period.endYear, right.period.endYear)
		},
		topics: mergeTopics({ left: left.topics, right: right.topics }),
		institutions,
		countryCodes: [
			...new Set([
				...left.countryCodes,
				...right.countryCodes,
				...institutions
					.map((institution) => institution.countryCode)
					.filter((countryCode): countryCode is string => Boolean(countryCode))
			])
		].sort(),
		investigators: mergeInvestigators({
			left: left.investigators,
			right: right.investigators
		}),
		outputs,
		fundedOutputsCount: Math.max(left.fundedOutputsCount, right.fundedOutputsCount, outputs.length),
		relevanceScore: Math.max(left.relevanceScore ?? 0, right.relevanceScore ?? 0) || null,
		sources,
		continuation: {
			recordCount: sources.length,
			openAlexIds: sources.map((source) => source.openAlexId),
			funderAwardIds: [
				...new Set(
					sources
						.map((source) => source.funderAwardId)
						.filter((awardId): awardId is string => Boolean(awardId))
				)
			]
		}
	};

	return { ...baseCandidate, metadata: calculateAwardMetadata(baseCandidate) };
};

const deduplicateAwardCandidates = (candidates: AwardCandidate[]) => {
	const candidatesByContinuation = new Map<string, AwardCandidate>();

	for (const candidate of candidates) {
		const key = getContinuationKey(candidate);
		const current = candidatesByContinuation.get(key);

		candidatesByContinuation.set(
			key,
			current ? mergeAwardCandidates({ left: current, right: candidate }) : candidate
		);
	}

	return [...candidatesByContinuation.values()];
};

export {
	canonicalizeFunderAwardId,
	deduplicateAwardCandidates,
	getContinuationKey,
	mergeAwardCandidates
};
