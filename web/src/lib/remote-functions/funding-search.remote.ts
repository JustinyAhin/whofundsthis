import { form, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

import { createCombinedAwardCandidateSearchService } from '$lib/server/awards/search-combined-award-candidates';
import { createAwardCandidateSearchService } from '$lib/server/awards/search-award-candidates';
import { createSemanticAwardCandidateSearchService } from '$lib/server/awards/search-semantic-award-candidates';
import { createFunderMatchSearchService } from '$lib/server/funders/search-funder-matches';
import { OpenAlexClientError, createOpenAlexClient } from '$lib/server/openalex/client';
import { createSemanticWorksClient } from '$lib/server/openalex/semantic-works-client';

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

const startFundingSearch = form(fundingSearchSchema, ({ description, countryCode, field }) => {
	const search = new URLSearchParams({ q: description });

	if (countryCode) search.set('country', countryCode);
	if (field) search.set('field', field);

	redirect(303, `/results?${search.toString()}`);
});

const getFundingResults = query(
	fundingSearchSchema,
	async ({ description, countryCode, field }) => {
		const event = getRequestEvent();
		const env = event.platform?.env;
		const client = createOpenAlexClient({
			apiKey: env?.OPENALEX_API_KEY,
			fetch: event.fetch
		});
		const keywordSearchService = createAwardCandidateSearchService({ client });
		const semanticSearchService = createSemanticAwardCandidateSearchService({
			client: createSemanticWorksClient({
				apiKey: env?.OPENALEX_API_KEY,
				fetch: event.fetch
			})
		});
		const candidateSearchService = createCombinedAwardCandidateSearchService({
			keywordSearchService,
			semanticSearchService
		});
		const funderSearchService = createFunderMatchSearchService({ candidateSearchService });

		try {
			return await funderSearchService.searchFunderMatches({
				description,
				countryCode: countryCode || undefined,
				field: field || undefined,
				limit: 50
			});
		} catch (cause) {
			if (cause instanceof OpenAlexClientError) {
				error(502, 'OpenAlex could not complete this search. Please try again.');
			}

			throw cause;
		}
	}
);

export { getFundingResults, startFundingSearch };
