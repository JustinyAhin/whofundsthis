import * as v from 'valibot';

import openAlexFields from '$lib/data/openalex-fields.json';
import { createFundingSearchParameters, fundingSearchSchema } from '$lib/funding-search';

type CreateFundingSearchToolOptions = {
	navigate: (url: string) => Promise<unknown> | unknown;
	resultsPath: string;
};

const getValidationMessage = (issues: v.BaseIssue<unknown>[]) =>
	issues.map((issue) => issue.message).join(' ');

const createFundingSearchTool = ({
	navigate,
	resultsPath
}: CreateFundingSearchToolOptions): WebMCP.ModelContextTool => ({
	name: 'find_historical_funders',
	title: 'Find historical funders',
	description:
		'Find organizations that previously funded similar research and show the historical award evidence. Use only a short, non-confidential research summary. Matches do not establish eligibility or predict future funding.',
	inputSchema: {
		type: 'object',
		additionalProperties: false,
		properties: {
			description: {
				type: 'string',
				minLength: 12,
				maxLength: 1000,
				description: 'A short, non-confidential description of the proposed research.'
			},
			countryCode: {
				type: 'string',
				pattern: '^[A-Za-z]{2}$',
				description: 'Optional two-letter ISO code for the applicant country.'
			},
			field: {
				type: 'string',
				enum: openAlexFields.fields.map(({ displayName }) => displayName),
				description: 'Optional OpenAlex broad research field.'
			}
		},
		required: ['description']
	},
	annotations: {
		readOnlyHint: true,
		untrustedContentHint: false
	},
	execute: async (input) => {
		const parsedInput = v.safeParse(fundingSearchSchema, input);

		if (!parsedInput.success) {
			throw new TypeError(getValidationMessage(parsedInput.issues));
		}

		const search = createFundingSearchParameters(parsedInput.output);
		await navigate(`${resultsPath}?${search.toString()}`);

		return 'The historical funding search is loading in the current page.';
	}
});

export { createFundingSearchTool, type CreateFundingSearchToolOptions };
