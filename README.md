# Who Funds This?

Who Funds This? helps researchers discover which organizations have funded work
like theirs and inspect the historical awards behind each match.

Researchers enter a short, non-confidential description of their idea and can
optionally add a country and field. The app ranks relevant funders, explains why
they appear, and links to the source records behind each result.

## How OpenAlex is used

[OpenAlex](https://openalex.org/) is the project's source of award and research
metadata. The app searches OpenAlex awards when a request comes in. If the
direct search is too sparse, it also finds related publications and follows
their links back to awards. The resulting records are deduplicated, scored, and
grouped by funder. The score accounts for text relevance, topic overlap,
geography, recency, and the completeness of the available metadata.

OpenAlex records vary in completeness. Who Funds This? keeps that uncertainty
visible and links back to the source records. Results show historical
similarity; they do not establish eligibility or predict whether a funder will
support a new proposal. The app queries OpenAlex as needed instead of
maintaining a full local copy.

Learn more in the [OpenAlex Awards documentation](https://help.openalex.org/data/awards/)
and the project's [matching notes](kb/scoring.md).

## Current scope

Who Funds This? gives researchers, grant professionals, and research offices a
practical way to investigate the funding history around a research idea. Each
search produces ranked funder results with detailed award evidence and a URL
that can be shared with colleagues.

The product focuses on the question, "Who has funded work like this before?"
It is not a database of open calls and does not write grant proposals.

## Development

The web app uses SvelteKit, TypeScript, Bun, and the Cloudflare Workers adapter.
An OpenAlex API key is required for local searches.

```sh
cd web
bun install
cp .env.example .env
# Add your OpenAlex API key to .env, then start the app:
bun run dev
```

Before opening a change, run the project checks from `web/`:

```sh
bun run format
bun run lint
bun run check
bun run build
```

## Project documentation

- [Product knowledge base](kb/README.md): product decisions, MVP scope, SEO, and
  matching methodology
- [Web application](web/README.md)
