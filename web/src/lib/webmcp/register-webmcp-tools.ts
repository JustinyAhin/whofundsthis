import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { createFundingSearchTool } from '$lib/webmcp/funding-search-tool';

const registerWebMcpTools = () => {
	const modelContext = document.modelContext;
	if (!modelContext) return;

	const controller = new AbortController();
	const tool = createFundingSearchTool({
		navigate: goto,
		resultsPath: resolve('/results')
	});

	void modelContext.registerTool(tool, { signal: controller.signal }).catch((cause: unknown) => {
		if (controller.signal.aborted) return;
		console.warn('Could not register the WebMCP funding search tool.', cause);
	});

	return () => controller.abort();
};

export { registerWebMcpTools };
