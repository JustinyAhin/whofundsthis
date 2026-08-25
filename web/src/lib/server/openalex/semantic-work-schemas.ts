import * as v from 'valibot';

const nullableStringSchema = v.nullish(v.string());
const nullableNumberSchema = v.nullish(v.number());

const semanticWorkAwardSchema = v.object({
	id: v.string(),
	display_name: nullableStringSchema,
	funder_award_id: nullableStringSchema,
	funder_id: nullableStringSchema,
	funder_display_name: nullableStringSchema
});

const semanticWorkSchema = v.object({
	id: v.string(),
	doi: nullableStringSchema,
	title: nullableStringSchema,
	publication_year: nullableNumberSchema,
	awards: v.nullish(v.array(semanticWorkAwardSchema)),
	relevance_score: nullableNumberSchema
});

const semanticWorksMetaSchema = v.object({
	count: v.number(),
	db_response_time_ms: nullableNumberSchema,
	page: nullableNumberSchema,
	per_page: v.number(),
	next_cursor: nullableStringSchema,
	groups_count: nullableNumberSchema,
	cost_usd: nullableNumberSchema
});

const semanticWorksPageSchema = v.object({
	meta: semanticWorksMetaSchema,
	results: v.array(semanticWorkSchema)
});

type OpenAlexSemanticWork = v.InferOutput<typeof semanticWorkSchema>;
type OpenAlexSemanticWorkAward = v.InferOutput<typeof semanticWorkAwardSchema>;
type OpenAlexSemanticWorksPage = v.InferOutput<typeof semanticWorksPageSchema>;

export {
	semanticWorksPageSchema,
	type OpenAlexSemanticWork,
	type OpenAlexSemanticWorkAward,
	type OpenAlexSemanticWorksPage
};
