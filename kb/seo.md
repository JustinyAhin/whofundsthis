# SEO

## Thesis

Do not compete first for “grant database.” That query usually means currently open opportunities and is dominated by government and established commercial products.

Own the long-tail questions that historical OpenAlex data can answer:

- Who funds research on a specific topic?
- Who funds that topic in a specific country or region?
- What grants has an institution or investigator received?
- What research resulted from a grant?

## Directional US keyword signals

Gathered with `naps-cli` on 2026-08-25. Branded volumes are navigational and not realistically attainable targets.

| Query | Monthly volume | Use |
| --- | ---: | --- |
| `NIH RePORTER` | 110,000 | Demand signal only; do not target directly. |
| `NSF award search` | 8,100 | Demand signal only; official site dominates. |
| `grant database` | 480 | Wrong initial intent: open opportunities. |
| `NIH funded research` | 260 | Supporting guide or comparison. |
| `research grant database` | 90 | Product/category page. |
| `who funds cancer research` | 20 | Model for topic pages. |
| `research funding in Africa` | 10 | Model for regional reports. |

## First public pages

Start with a small, edited set:

- `/topics/malaria/funding`
- `/topics/malaria/funding/west-africa`
- `/countries/benin/research-funding`
- `/countries/nigeria/research-funding`
- `/institutions/[institution]/funding`
- `/funders/[funder]`
- `/guides/how-to-find-who-funded-similar-research`
- `/guides/nih-reporter-alternatives`

Topic, country, institution, and funder pages must include original aggregates, representative awards, resulting publications, provenance, coverage limits, and a last-updated date. Do not create millions of thin award pages.

## Distribution

- Publish a few citable funding-landscape reports with downloadable data.
- Open-source the matching method and document its limitations.
- Share useful reports with research offices, libraries, open-science communities, and relevant journalists.
- Use the free matcher as the call to action on every public page.
- Consider French pages only after the English structure proves useful.

## Technical requirements

- Server-rendered public pages with canonical URLs and breadcrumbs.
- Separate sitemaps by page type.
- `Dataset` structured data for downloadable reports.
- `noindex` for private searches, thin pages, and low-confidence records.
- Clear source links, methodology, and update timestamps.

## Expectations and metrics

Organic traffic will likely be small initially. A reasonable validation range is 1,000–5,000 monthly organic visits after 6–12 months only if the site earns links and publishes dozens of useful pages. Larger traffic depends on thousands of genuinely valuable long-tail pages, not automated page count alone.

Track completed searches, evidence-link clicks, exports, repeat searches, and professional or institutional inquiries. Pageviews alone do not validate the product.
