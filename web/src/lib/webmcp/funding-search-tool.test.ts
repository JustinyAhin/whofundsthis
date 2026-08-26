import { describe, expect, test } from 'bun:test';

import { createFundingSearchTool } from '$lib/webmcp/funding-search-tool';

const executeTool = async ({
	input,
	navigate
}: {
	input: Record<string, unknown>;
	navigate: (url: string) => Promise<unknown> | unknown;
}) => {
	const tool = createFundingSearchTool({ navigate, resultsPath: '/results' });
	return tool.execute(input, { signal: new AbortController().signal });
};

describe('funding search WebMCP tool', () => {
	test('describes a read-only, non-confidential funding search', () => {
		const tool = createFundingSearchTool({ navigate: () => undefined, resultsPath: '/results' });

		expect(tool.name).toBe('find_historical_funders');
		expect(tool.description).toContain('non-confidential');
		expect(tool.annotations).toEqual({
			readOnlyHint: true,
			untrustedContentHint: false
		});
	});

	test('normalizes input and navigates through the existing results route', async () => {
		const navigations: string[] = [];

		await executeTool({
			input: {
				description: '  Community health workers improving maternal care  ',
				countryCode: 'bj',
				field: 'Medicine'
			},
			navigate: (url) => navigations.push(url)
		});

		expect(navigations).toEqual([
			'/results?q=Community+health+workers+improving+maternal+care&country=BJ&field=Medicine'
		]);
	});

	test('omits optional empty parameters', async () => {
		const navigations: string[] = [];

		await executeTool({
			input: { description: 'Malaria vaccine research in pregnancy' },
			navigate: (url) => navigations.push(url)
		});

		expect(navigations).toEqual(['/results?q=Malaria+vaccine+research+in+pregnancy']);
	});

	test('rejects invalid input before navigation', async () => {
		let navigationCount = 0;

		expect(
			executeTool({
				input: { description: 'Too short', countryCode: 'Benin' },
				navigate: () => {
					navigationCount += 1;
				}
			})
		).rejects.toThrow('Describe the research in at least 12 characters.');
		expect(navigationCount).toBe(0);
	});
});
