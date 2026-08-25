import type { OpenAlexAward } from '$lib/server/openalex/schemas';

import type {
	AwardCandidate,
	AwardInstitution,
	AwardInvestigator,
	AwardInvestigatorRole,
	AwardMetadata,
	AwardMetadataConfidence,
	AwardMetadataPresence,
	AwardOutput,
	AwardTopic
} from './types';

const OPENALEX_URL = 'https://openalex.org/';
const DOI_URL = 'https://doi.org/';
const ROR_URL = 'https://ror.org/';
const ORCID_URL = 'https://orcid.org/';

const normalizeText = (value: string | null | undefined) => {
	const normalized = value?.replace(/\s+/g, ' ').trim();
	return normalized || null;
};

const normalizeIdentifier = ({ value, prefix }: { value: string; prefix: string }) =>
	value.replace(new RegExp(`^${prefix}`, 'i'), '').replace(/^\/+|\/+$/g, '');

const normalizeOpenAlexId = (value: string) =>
	normalizeIdentifier({ value, prefix: 'https?://openalex\\.org/' }).toUpperCase();

const normalizeDoi = (value: string | null | undefined) => {
	const normalized = normalizeText(value);
	return normalized
		? normalizeIdentifier({
				value: normalized,
				prefix: 'https?://(?:dx\\.)?doi\\.org/'
			}).toLowerCase()
		: null;
};

const normalizeRor = (value: string | null | undefined) => {
	const normalized = normalizeText(value);
	return normalized
		? normalizeIdentifier({ value: normalized, prefix: 'https?://ror\\.org/' }).toLowerCase()
		: null;
};

const normalizeOrcid = (value: string | null | undefined) => {
	const normalized = normalizeText(value);
	return normalized
		? normalizeIdentifier({ value: normalized, prefix: 'https?://orcid\\.org/' })
		: null;
};

const normalizeUrl = (value: string | null | undefined) => normalizeText(value);

const normalizeTopic = (topic: NonNullable<OpenAlexAward['primary_topic']>): AwardTopic => ({
	id: normalizeOpenAlexId(topic.id),
	name: topic.display_name.trim(),
	score: topic.score,
	subfield: {
		id: normalizeOpenAlexId(topic.subfield.id),
		name: topic.subfield.display_name.trim()
	},
	field: {
		id: normalizeOpenAlexId(topic.field.id),
		name: topic.field.display_name.trim()
	},
	domain: {
		id: normalizeOpenAlexId(topic.domain.id),
		name: topic.domain.display_name.trim()
	}
});

const normalizeTopics = (award: OpenAlexAward) => {
	const topics = [...(award.topics ?? []), ...(award.primary_topic ? [award.primary_topic] : [])];
	const topicsById = new Map<string, AwardTopic>();

	for (const topic of topics) {
		const normalized = normalizeTopic(topic);
		const current = topicsById.get(normalized.id);

		if (!current || normalized.score > current.score) {
			topicsById.set(normalized.id, normalized);
		}
	}

	return [...topicsById.values()].sort((left, right) => right.score - left.score);
};

const normalizeInstitution = (
	institution: NonNullable<OpenAlexAward['institution_awarded']>[number]
): AwardInstitution => {
	const ror = normalizeRor(institution.ror);

	return {
		id: normalizeOpenAlexId(institution.id),
		name: institution.display_name.trim(),
		ror,
		rorUrl: ror ? `${ROR_URL}${ror}` : null,
		countryCode: normalizeText(institution.country_code)?.toUpperCase() ?? null,
		type: normalizeText(institution.type),
		lineageIds: institution.lineage.map(normalizeOpenAlexId)
	};
};

type OpenAlexInvestigator = NonNullable<OpenAlexAward['lead_investigator']>;

const normalizeInvestigator = ({
	investigator,
	role
}: {
	investigator: OpenAlexInvestigator;
	role: AwardInvestigatorRole;
}): AwardInvestigator => {
	const givenName = normalizeText(investigator.given_name);
	const familyName = normalizeText(investigator.family_name);
	const name = normalizeText([givenName, familyName].filter(Boolean).join(' '));
	const orcid = normalizeOrcid(investigator.orcid);

	return {
		givenName,
		familyName,
		name,
		orcid,
		orcidUrl: orcid ? `${ORCID_URL}${orcid}` : null,
		roleStart: normalizeText(investigator.role_start),
		roles: [role],
		affiliation: investigator.affiliation
			? {
					name: normalizeText(investigator.affiliation.name),
					country: normalizeText(investigator.affiliation.country)
				}
			: null
	};
};

const getInvestigatorKey = (investigator: AwardInvestigator) =>
	investigator.orcid ??
	[investigator.name, investigator.affiliation?.name].filter(Boolean).join(':').toLocaleLowerCase();

const normalizeInvestigators = (award: OpenAlexAward) => {
	const investigators: AwardInvestigator[] = [];

	if (award.lead_investigator) {
		investigators.push(
			normalizeInvestigator({ investigator: award.lead_investigator, role: 'lead' })
		);
	}

	if (award.co_lead_investigator) {
		investigators.push(
			normalizeInvestigator({ investigator: award.co_lead_investigator, role: 'co-lead' })
		);
	}

	for (const investigator of award.investigators ?? []) {
		investigators.push(normalizeInvestigator({ investigator, role: 'investigator' }));
	}

	const investigatorsByKey = new Map<string, AwardInvestigator>();

	for (const investigator of investigators) {
		const key = getInvestigatorKey(investigator);
		const current = investigatorsByKey.get(key);

		if (current) {
			current.roles = [...new Set([...current.roles, ...investigator.roles])];
		} else {
			investigatorsByKey.set(key, investigator);
		}
	}

	return [...investigatorsByKey.values()];
};

const normalizeOutput = (value: string): AwardOutput => {
	const id = normalizeOpenAlexId(value);
	return { id, url: `${OPENALEX_URL}${id}` };
};

const calculateAwardMetadata = (candidate: Omit<AwardCandidate, 'metadata'>): AwardMetadata => {
	const presence: AwardMetadataPresence = {
		title: Boolean(candidate.title),
		description: Boolean(candidate.description),
		funder: Boolean(candidate.funder),
		funderAwardId: Boolean(candidate.funderAwardId),
		amount: candidate.funding.amount !== null && Boolean(candidate.funding.currency),
		dates: Boolean(candidate.period.startDate ?? candidate.period.startYear),
		topics: candidate.topics.length > 0,
		institutions: candidate.institutions.length > 0,
		countries: candidate.countryCodes.length > 0,
		investigators: candidate.investigators.length > 0,
		outputs: candidate.fundedOutputsCount > 0,
		sourceUrl: candidate.sources.some((source) => Boolean(source.landingPageUrl)),
		provenance: candidate.sources.some((source) => Boolean(source.provenance))
	};
	const values = Object.values(presence);
	const availableFieldCount = values.filter(Boolean).length;
	const coverage = availableFieldCount / values.length;
	const confidence: AwardMetadataConfidence =
		coverage >= 0.75 ? 'high' : coverage >= 0.45 ? 'medium' : 'low';

	return {
		presence,
		availableFieldCount,
		totalFieldCount: values.length,
		coverage,
		confidence
	};
};

const normalizeOpenAlexAward = (award: OpenAlexAward): AwardCandidate => {
	const id = normalizeOpenAlexId(award.id);
	const doi = normalizeDoi(award.doi);
	const funderDoi = normalizeDoi(award.funder?.doi);
	const institutions = (award.institution_awarded ?? []).map(normalizeInstitution);
	const countryCodes = [
		...new Set(
			institutions
				.map((institution) => institution.countryCode)
				.filter((countryCode): countryCode is string => Boolean(countryCode))
		)
	].sort();
	const baseCandidate: Omit<AwardCandidate, 'metadata'> = {
		id,
		openAlexUrl: `${OPENALEX_URL}${id}`,
		title: normalizeText(award.display_name),
		description: normalizeText(award.description),
		funderAwardId: normalizeText(award.funder_award_id),
		funder: award.funder
			? {
					id: normalizeOpenAlexId(award.funder.id),
					name: award.funder.display_name.trim(),
					doi: funderDoi,
					doiUrl: funderDoi ? `${DOI_URL}${funderDoi}` : null
				}
			: null,
		funding: {
			amount: award.amount ?? null,
			currency: normalizeText(award.currency)?.toUpperCase() ?? null,
			type: normalizeText(award.funding_type),
			scheme: normalizeText(award.funder_scheme)
		},
		period: {
			startDate: normalizeText(award.start_date),
			endDate: normalizeText(award.end_date),
			startYear: award.start_year ?? null,
			endYear: award.end_year ?? null
		},
		topics: normalizeTopics(award),
		institutions,
		countryCodes,
		investigators: normalizeInvestigators(award),
		outputs: award.funded_outputs.map(normalizeOutput),
		fundedOutputsCount: award.funded_outputs_count,
		relevanceScore: award.relevance_score ?? null,
		sources: [
			{
				openAlexId: id,
				openAlexUrl: `${OPENALEX_URL}${id}`,
				funderAwardId: normalizeText(award.funder_award_id),
				provenance: normalizeText(award.provenance),
				landingPageUrl: normalizeUrl(award.landing_page_url),
				worksApiUrl: normalizeUrl(award.works_api_url),
				doi,
				doiUrl: doi ? `${DOI_URL}${doi}` : null,
				amount: award.amount ?? null,
				currency: normalizeText(award.currency)?.toUpperCase() ?? null,
				startDate: normalizeText(award.start_date),
				endDate: normalizeText(award.end_date),
				startYear: award.start_year ?? null,
				endYear: award.end_year ?? null,
				createdDate: normalizeText(award.created_date),
				updatedDate: normalizeText(award.updated_date)
			}
		],
		continuation: {
			recordCount: 1,
			openAlexIds: [id],
			funderAwardIds: award.funder_award_id ? [award.funder_award_id] : []
		}
	};

	return { ...baseCandidate, metadata: calculateAwardMetadata(baseCandidate) };
};

export {
	calculateAwardMetadata,
	normalizeDoi,
	normalizeOpenAlexAward,
	normalizeOpenAlexId,
	normalizeText
};
