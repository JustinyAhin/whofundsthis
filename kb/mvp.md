# MVP

## Goal

Prove that a researcher can enter one idea, find credible funders they did not already know, and use the evidence in a real funding conversation.

## First workflow

1. Enter a short, non-confidential research description.
2. Optionally select applicant country and broad field.
3. Retrieve candidate awards from the OpenAlex API.
4. Rerank them using text relevance, topic overlap, geography, recency, and metadata confidence.
5. Group the best awards by funder.
6. Show why each funder appears, with links to awards and resulting publications.
7. Produce a shareable results URL.

The score must remain explainable. Show its dimensions rather than only a single opaque percentage.

## First interface

Only three surfaces are required:

- Landing page with the research description and country input.
- Results page grouped by funder.
- Funder detail view with matching awards and evidence.

No account is required initially.

## Privacy boundary

Tell users not to paste confidential proposals. Do not store their text by default or include it in logs. A later confidential mode may extract generic concepts locally and send only those concepts to OpenAlex.

## Technical shape

- SvelteKit and TypeScript on Cloudflare Workers.
- OpenAlex API for candidate retrieval and enrichment.
- Server-side matching and aggregation.
- Cache validated OpenAlex responses for one hour using hashed keys that exclude raw query text and API keys. Retry only transient failures, with an eight-second timeout per attempt and at most three attempts.
- Add persistence only when saved searches or reports require it.

Do not embed or index all OpenAlex awards. Retrieve a small candidate set first and add semantic reranking only if OpenAlex relevance is insufficient.

## Exclusions

- Authentication, billing, teams, and dashboards.
- Current-opportunity aggregation.
- AI-written funding recommendations without source evidence.
- Maps, complex charts, PDF reports, and alerts.
- A vector database or full OpenAlex snapshot.

## Build order

1. OpenAlex awards client and sample queries.
2. Matching and transparent score breakdown.
3. Funder aggregation.
4. Results UI and source links.
5. Shareable URLs and basic analytics.
6. Five real-user tests before expanding scope.

The MVP succeeds when at least two users return with a second research idea or use an exported result in a real proposal discussion.
