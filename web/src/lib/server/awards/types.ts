type AwardFunder = {
	id: string;
	name: string;
	doi: string | null;
	doiUrl: string | null;
};

type AwardTopicLevel = {
	id: string;
	name: string;
};

type AwardTopic = {
	id: string;
	name: string;
	score: number;
	subfield: AwardTopicLevel;
	field: AwardTopicLevel;
	domain: AwardTopicLevel;
};

type AwardInstitution = {
	id: string;
	name: string;
	ror: string | null;
	rorUrl: string | null;
	countryCode: string | null;
	type: string | null;
	lineageIds: string[];
};

type AwardInvestigatorRole = 'lead' | 'co-lead' | 'investigator';

type AwardInvestigator = {
	givenName: string | null;
	familyName: string | null;
	name: string | null;
	orcid: string | null;
	orcidUrl: string | null;
	roleStart: string | null;
	roles: AwardInvestigatorRole[];
	affiliation: {
		name: string | null;
		country: string | null;
	} | null;
};

type AwardOutput = {
	id: string;
	url: string;
};

type AwardSourceRecord = {
	openAlexId: string;
	openAlexUrl: string;
	funderAwardId: string | null;
	provenance: string | null;
	landingPageUrl: string | null;
	worksApiUrl: string | null;
	doi: string | null;
	doiUrl: string | null;
	amount: number | null;
	currency: string | null;
	startDate: string | null;
	endDate: string | null;
	startYear: number | null;
	endYear: number | null;
	createdDate: string | null;
	updatedDate: string | null;
};

type AwardMetadataPresence = {
	title: boolean;
	description: boolean;
	funder: boolean;
	funderAwardId: boolean;
	amount: boolean;
	dates: boolean;
	topics: boolean;
	institutions: boolean;
	countries: boolean;
	investigators: boolean;
	outputs: boolean;
	sourceUrl: boolean;
	provenance: boolean;
};

type AwardMetadataConfidence = 'low' | 'medium' | 'high';

type AwardMetadata = {
	presence: AwardMetadataPresence;
	availableFieldCount: number;
	totalFieldCount: number;
	coverage: number;
	confidence: AwardMetadataConfidence;
};

type AwardCandidate = {
	id: string;
	openAlexUrl: string;
	title: string | null;
	description: string | null;
	funderAwardId: string | null;
	funder: AwardFunder | null;
	funding: {
		amount: number | null;
		currency: string | null;
		type: string | null;
		scheme: string | null;
	};
	period: {
		startDate: string | null;
		endDate: string | null;
		startYear: number | null;
		endYear: number | null;
	};
	topics: AwardTopic[];
	institutions: AwardInstitution[];
	countryCodes: string[];
	investigators: AwardInvestigator[];
	outputs: AwardOutput[];
	fundedOutputsCount: number;
	relevanceScore: number | null;
	sources: AwardSourceRecord[];
	continuation: {
		recordCount: number;
		openAlexIds: string[];
		funderAwardIds: string[];
	};
	metadata: AwardMetadata;
};

type SearchAwardCandidatesOptions = {
	description: string;
	countryCode?: string;
	field?: string;
	limit?: number;
	signal?: AbortSignal;
};

type AwardCandidateSearchResult = {
	query: {
		description: string;
		countryCode: string | null;
		field: string | null;
		openAlexSearch: string;
	};
	meta: {
		totalOpenAlexMatches: number;
		retrievedAwardCount: number;
		candidateCount: number;
		deduplicatedAwardCount: number;
		costUsd: number | null;
	};
	candidates: AwardCandidate[];
};

export {
	type AwardCandidate,
	type AwardCandidateSearchResult,
	type AwardFunder,
	type AwardInstitution,
	type AwardInvestigator,
	type AwardInvestigatorRole,
	type AwardMetadata,
	type AwardMetadataConfidence,
	type AwardMetadataPresence,
	type AwardOutput,
	type AwardSourceRecord,
	type AwardTopic,
	type AwardTopicLevel,
	type SearchAwardCandidatesOptions
};
