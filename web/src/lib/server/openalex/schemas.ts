import * as v from 'valibot';

const nullableStringSchema = v.nullish(v.string());
const nullableNumberSchema = v.nullish(v.number());

const funderSchema = v.object({
	id: v.string(),
	display_name: v.string(),
	doi: nullableStringSchema
});

const topicLevelSchema = v.object({
	id: v.string(),
	display_name: v.string()
});

const awardTopicSchema = v.object({
	id: v.string(),
	display_name: v.string(),
	score: v.number(),
	subfield: topicLevelSchema,
	field: topicLevelSchema,
	domain: topicLevelSchema
});

const awardedInstitutionSchema = v.object({
	id: v.string(),
	display_name: v.string(),
	ror: nullableStringSchema,
	country_code: nullableStringSchema,
	type: nullableStringSchema,
	lineage: v.array(v.string())
});

const investigatorAffiliationSchema = v.object({
	name: nullableStringSchema,
	country: nullableStringSchema,
	ids: v.nullish(v.unknown())
});

const investigatorSchema = v.object({
	given_name: nullableStringSchema,
	family_name: nullableStringSchema,
	orcid: nullableStringSchema,
	role_start: nullableStringSchema,
	affiliation: v.nullish(investigatorAffiliationSchema)
});

const openAlexAwardSchema = v.object({
	id: v.string(),
	display_name: nullableStringSchema,
	description: nullableStringSchema,
	funder_award_id: nullableStringSchema,
	funder: v.nullish(funderSchema),
	funded_outputs: v.array(v.string()),
	funded_outputs_count: v.number(),
	amount: nullableNumberSchema,
	currency: nullableStringSchema,
	funding_type: nullableStringSchema,
	funder_scheme: nullableStringSchema,
	start_date: nullableStringSchema,
	end_date: nullableStringSchema,
	start_year: nullableNumberSchema,
	end_year: nullableNumberSchema,
	landing_page_url: nullableStringSchema,
	doi: nullableStringSchema,
	provenance: nullableStringSchema,
	lead_investigator: v.nullish(investigatorSchema),
	co_lead_investigator: v.nullish(investigatorSchema),
	investigators: v.nullish(v.array(investigatorSchema)),
	works_api_url: nullableStringSchema,
	primary_topic: v.nullish(awardTopicSchema),
	topics: v.nullish(v.array(awardTopicSchema)),
	institution_awarded: v.nullish(v.array(awardedInstitutionSchema)),
	created_date: nullableStringSchema,
	updated_date: nullableStringSchema,
	relevance_score: nullableNumberSchema
});

const openAlexMetaSchema = v.object({
	count: v.number(),
	db_response_time_ms: nullableNumberSchema,
	page: nullableNumberSchema,
	per_page: v.number(),
	next_cursor: nullableStringSchema,
	groups_count: nullableNumberSchema,
	cost_usd: nullableNumberSchema
});

const openAlexAwardsPageSchema = v.object({
	meta: openAlexMetaSchema,
	results: v.array(openAlexAwardSchema)
});

type OpenAlexAward = v.InferOutput<typeof openAlexAwardSchema>;
type OpenAlexAwardsPage = v.InferOutput<typeof openAlexAwardsPageSchema>;

export {
	openAlexAwardSchema,
	openAlexAwardsPageSchema,
	type OpenAlexAward,
	type OpenAlexAwardsPage
};
