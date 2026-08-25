# Who Funds This? web

SvelteKit 5 and TypeScript application deployed to Cloudflare Workers.

## Context

- Product decisions live in `../kb/project.md` and `../kb/mvp.md`.
- SEO and public-page decisions live in `../kb/seo.md`.
- Follow the shared [code conventions](https://github.com/JustinyAhin/kb/blob/main/engineering/code-conventions.md), [SvelteKit conventions](https://github.com/JustinyAhin/kb/blob/main/stacks/sveltekit/conventions.md), and [Cloudflare Workers conventions](https://github.com/JustinyAhin/kb/blob/main/stacks/cloudflare-workers/conventions.md).

## Workflow

- Use Bun and the scripts declared in `package.json`.
- For changed code, run formatting, lint, check, then build as appropriate.
- Keep changes surgical and add tests in proportion to risk.
- Never read `.env` or other secret files; let the user provide required values.
- Never commit unless explicitly asked.
