# Repository guidance

The shared KB at <https://github.com/JustinyAhin/kb> is authoritative for engineering, framework, design, workflow, documentation, and Git conventions. Keep this file as a routing layer; do not duplicate the shared KB here.

Before working:

- Read `kb/project.md` and `kb/mvp.md` for product decisions.
- Read `kb/seo.md` for public pages or acquisition work.
- Read the applicable shared KB guidance, especially `engineering/workflow.md`, `engineering/code-conventions.md`, and `stacks/sveltekit/conventions.md`.

Use local `kb/` files for product requirements and the shared KB for general conventions. If they conflict, follow the more specific local product decision and report the conflict.

The `web/` app uses Bun. Run its declared scripts from `web/`; do not substitute another package manager. Keep changes minimal, never read secret files, and never commit unless explicitly asked.

## Verification

Run the declared scripts from `web/` in this order:

```text
bun run format
bun run lint
bun run check
bun run build
```

Run `check` before `build`. The Cloudflare adapter can leave compiled JavaScript under `.svelte-kit` that a later type check may incorrectly diagnose as source code. Follow the shared SvelteKit conventions if a post-build check must be repeated, and never hand-edit generated types.

## Design Context

### Users

The primary users are active researchers, grant professionals, and research-support staff, especially at small or under-resourced institutions. They arrive with a concrete research idea and need to identify plausible funders, understand why each one appears, and carry credible evidence into a funding conversation.

They may be working under time pressure and evaluating unfamiliar organizations. The interface should reduce uncertainty without overstating what historical data can prove. It must make provenance, scoring dimensions, limitations, and source records easy to inspect.

### Brand Personality

The product is credible, calm, and rigorous. It should feel like a carefully edited research publication combined with a focused professional tool: authoritative without being institutional, modern without chasing trends, and helpful without sounding promotional.

The emotional goal is informed confidence. Users should feel that the product has done serious analytical work while leaving them in control of the judgment.

### Aesthetic Direction

Treat the current redesigned website as the canonical visual reference. The direction is editorial, evidence-led, and restrained.

- Use deep navy and near-black for authority, off-white and white for readable working surfaces, saturated blue as the primary action and selection color, and warm copper only as a secondary evidence accent.
- Preserve the current palette: page `#f4f7fb`, surface `#ffffff`, strong ink `#111b2d`, body ink `#263244`, muted ink `#5e6b7c`, primary blue `#175cd3`, dark blue `#0b3f91`, soft blue `#dbeafe`, copper `#a65220`, and soft copper `#f7e5d8`.
- Pair an editorial serif for major headings and important result titles with the humanist sans-serif stack for controls, labels, metadata, and body copy. Large serif type should create hierarchy, not decoration.
- Prefer generous whitespace, strong typographic hierarchy, fine rules, structured grids, and table-like evidence layouts. Use asymmetry when it clarifies the relationship between explanation and data.
- Keep geometry compact and precise. Controls and containers use small radii around `0.35rem`; avoid bubbly cards, excessive pills, and uniformly rounded containers.
- Use shadows sparingly and only where elevation communicates behavior, such as a floating combobox. Static sections should normally rely on contrast, spacing, and borders.
- Motion should be quiet and functional. Keep transitions short, around 140ms, and limited to state changes such as focus, hover, opening, and selection. Respect reduced-motion preferences when adding anything more involved.
- The magnifying-glass mark with its copper evidence point is the canonical brand symbol. It represents finding the evidence inside a larger body of research.

Impeccable is a reference for design discipline: intentional hierarchy, coherent spacing, polished states, and attention to interaction details. Do not imitate another product's surface style when it conflicts with this established research-editorial identity.

Avoid generic SaaS aesthetics: gradients, glassmorphism, decorative blobs, oversized pill buttons, gratuitous dashboards, dense card grids, stock illustrations, inflated marketing copy, and visual effects without informational purpose. Do not make the product resemble a grant marketplace or imply that matches are live opportunities or eligibility decisions.

### Design Principles

1. **Evidence before decoration.** Every visual element should help users search, compare, understand, or verify. Give sources, score dimensions, coverage limits, and uncertainty more prominence than ornamental metrics.
2. **Editorial hierarchy over dashboard chrome.** Establish one clear focal action per surface. Use typography, spacing, rules, and composition before introducing containers. Do not wrap every piece of content in a card.
3. **Restraint builds trust.** Blue carries primary actions, links, focus, and selected states. Copper is a limited supporting accent. Preserve ample neutral space, subtle borders, and low-intensity shadows.
4. **Progressively disclose complexity.** Lead with a useful shortlist and plain-language reasoning, then let users inspect awards, scoring details, outputs, and sources. Keep advanced evidence available without overwhelming the initial scan.
5. **Make interaction quality visible.** Inputs open from the input itself, support typing and full keyboard navigation, show clear focus rings, use compact single-line options where possible, and preserve familiar form behavior. Design hover, focus, selected, empty, loading, error, and disabled states deliberately.
6. **Write with precision.** Prefer direct, sober language. Clearly separate historical similarity from eligibility or prediction. Labels and helper text should answer likely questions at the point they arise.
7. **Design for real reading conditions.** Maintain WCAG AA contrast, never encode meaning with color alone, preserve comfortable line lengths, and make layouts collapse cleanly on narrow screens without hiding evidence or core actions.
