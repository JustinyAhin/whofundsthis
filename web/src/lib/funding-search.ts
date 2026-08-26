import * as v from 'valibot';

const descriptionSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(12, 'Describe the research in at least 12 characters.'),
	v.maxLength(1000, 'Keep the description under 1,000 characters.')
);

const countryCodeSchema = v.optional(
	v.union([
		v.literal(''),
		v.pipe(v.string(), v.trim(), v.toUpperCase(), v.regex(/^[A-Z]{2}$/, 'Choose a valid country.'))
	]),
	''
);

const fieldSchema = v.optional(v.pipe(v.string(), v.trim(), v.maxLength(100)), '');

const fundingSearchSchema = v.object({
	description: descriptionSchema,
	countryCode: countryCodeSchema,
	field: fieldSchema
});

type FundingSearchInput = v.InferOutput<typeof fundingSearchSchema>;

const createFundingSearchParameters = ({ description, countryCode, field }: FundingSearchInput) => {
	const search = new URLSearchParams({ q: description });

	if (countryCode) search.set('country', countryCode);
	if (field) search.set('field', field);

	return search;
};

export { createFundingSearchParameters, fundingSearchSchema, type FundingSearchInput };
