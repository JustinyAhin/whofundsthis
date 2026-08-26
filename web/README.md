# Who Funds This? web

SvelteKit application for finding organizations that previously funded similar research and
inspecting the historical award evidence behind each match.

## Development

Install dependencies and run the development server from this directory with Bun:

```sh
bun install
bun run dev
```

The application uses the OpenAlex API. Copy the variable names from `.env.example` into your local
environment and supply your own values. Do not commit local environment files.

## Verification

Run the declared checks in this order:

```sh
bun run format
bun run lint
bun run test
bun run check
bun run build
```

## WebMCP

The application progressively registers one imperative WebMCP tool:
`find_historical_funders`. It accepts a short, non-confidential research description and optional
country and field, validates them with the same schema as the visible search form, and navigates to
the existing evidence-backed results page.

Browsers without WebMCP support ignore the integration. No polyfill or cross-origin tool exposure
is used.

To test locally in a compatible Chrome build:

1. Open `chrome://flags/#enable-webmcp-testing`, enable the flag, and relaunch Chrome.
2. Run `bun run dev` and open the local site.
3. Use a WebMCP tool inspector to confirm that `find_historical_funders` is registered.
4. Invoke it with a non-confidential description and confirm that the current tab navigates to the
   expected `/results` URL.

Production use during Chrome's origin trial requires a token registered for the deployed origin.
Do not add a placeholder or a token belonging to another origin. WebMCP remains an enhancement; the
ordinary search form is the supported fallback and source of truth.
