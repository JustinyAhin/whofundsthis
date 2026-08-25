# Repository guidance

The shared KB at <https://github.com/JustinyAhin/kb> is authoritative for engineering, framework, design, workflow, documentation, and Git conventions. Keep this file as a routing layer; do not duplicate the shared KB here.

Before working:

- Read `kb/project.md` and `kb/mvp.md` for product decisions.
- Read `kb/seo.md` for public pages or acquisition work.
- Read the applicable shared KB guidance, especially `engineering/workflow.md`, `engineering/code-conventions.md`, and `stacks/sveltekit/conventions.md`.

Use local `kb/` files for product requirements and the shared KB for general conventions. If they conflict, follow the more specific local product decision and report the conflict.

The `web/` app uses Bun. Run its declared scripts from `web/`; do not substitute another package manager. Keep changes minimal, never read secret files, and never commit unless explicitly asked.
