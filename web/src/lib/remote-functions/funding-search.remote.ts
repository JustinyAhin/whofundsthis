import { form, getRequestEvent, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';

import { createFundingSearchParameters, fundingSearchSchema } from '$lib/funding-search';
import { createAwardCandidateSearchService } from '$lib/server/awards/search-award-candidates';
import { createSemanticAwardCandidateSearchService } from '$lib/server/awards/search-semantic-award-candidates';
import { createAdaptiveFunderMatchSearchService } from '$lib/server/funders/search-adaptive-funder-matches';
import { OpenAlexClientError, createOpenAlexClient } from '$lib/server/openalex/client';
import { createSemanticWorksClient } from '$lib/server/openalex/semantic-works-client';

const startFundingSearch = form(fundingSearchSchema, (input) => {
	const search = createFundingSearchParameters(input);
	redirect(303, `/results?${search.toString()}`);
});

const getFundingResults = query(
	fundingSearchSchema,
	async ({ description, countryCode, field }) => {
		const event = getRequestEvent();
		const platform = event.platform;
		const requestOptions = {
			apiKey: platform?.env.OPENALEX_API_KEY,
			cache: platform?.caches.default,
			fetch: event.fetch,
			waitUntil: platform
				? (promise: Promise<unknown>) => platform.ctx.waitUntil(promise)
				: undefined
		};
		const client = createOpenAlexClient({
			...requestOptions
		});
		const keywordSearchService = createAwardCandidateSearchService({ client });
		const semanticSearchService = createSemanticAwardCandidateSearchService({
			client: createSemanticWorksClient({
				...requestOptions
			})
		});
		const funderSearchService = createAdaptiveFunderMatchSearchService({
			keywordSearchService,
			semanticSearchService
		});

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
