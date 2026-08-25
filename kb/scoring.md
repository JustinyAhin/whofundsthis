# Matching score

## Purpose

The score ranks historical awards for one research description. It is an evidence-ranking aid, not an eligibility or funding-probability estimate.

Every result must expose the component scores and their explanations. Missing geography stays neutral rather than being treated as evidence that a funder does not support a country.

## Candidate retrieval

Candidate discovery combines two OpenAlex paths before scoring:

- Keyword search over awards retrieves records with direct textual overlap.
- Semantic search over works finds conceptually related publications, then hydrates only their linked OpenAlex awards.

The two ranked lists are fused with reciprocal-rank scores using an offset of 60. Raw OpenAlex keyword and semantic relevance values are not mixed because they use different, query-relative scales. Continuation records are deduplicated after fusion, and semantic work provenance remains attached to the combined retrieval result.

Keyword retrieval runs first. Semantic retrieval is added only when keyword search returns fewer than 10 candidates or its top funder score is below 70. On the five-case calibration set, this policy matched full semantic retrieval at nDCG@5 0.849 and precision@5 0.880 while reducing modeled OpenAlex cost by 55%. The thresholds must be reevaluated as the labeled calibration set grows.

When semantic retrieval runs, a semantic rate limit or an empty set of award-linked works falls back to keyword evidence. If keyword retrieval fails before the adaptive decision, semantic retrieval still runs as the fallback path.

This is request-time candidate retrieval, not a local OpenAlex index or vector database.

## Award dimensions

| Dimension           | Weight | Method                                                                                                                                                                      |
| ------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text relevance      |    40% | OpenAlex relevance, important-term overlap with available award text, and title overlap.                                                                                    |
| Topic overlap       |    20% | Best overlap with OpenAlex topic, subfield, field, and domain labels.                                                                                                       |
| Geography           |    15% | Exact awarded-institution country match is positive; missing geography is neutral; known other geography is a weak negative. Omitted when no applicant country is supplied. |
| Recency             |    15% | Active awards score highest, followed by a gradual ten-year half-life with a historical floor.                                                                              |
| Metadata confidence |    10% | Coverage across 13 evidence fields, including funder, dates, topics, geography, outputs, provenance, and source URL.                                                        |

The active weights are renormalized when geography is omitted. Scores are rounded to a 0–100 value only after combining their unrounded dimensions.

## Funder score

A funder's score combines its strongest award (60%) with the mean of its three strongest awards (40%). Up to eight additional points come from exact important-term coverage in the best award title, and the matched terms remain visible in the explanation. On the recorded five-case calibration set, this raised mean nDCG@5 from 0.852 to 0.914 without regressing an individual case. A separate multi-award support bonus did not improve the metric and was not retained.

Continuation records are merged conservatively using funder, normalized award number, and normalized title. Every underlying source record, amount, provenance value, and source link remains attached to the merged candidate.

## Initial calibration

Calibrated against live OpenAlex award searches on 2026-08-25:

1. `pregnancy malaria vaccine` — Benin, Medicine
2. `climate resilient maize farming` — Nigeria, Agricultural and Biological Sciences
3. `maternal health digital interventions` — Ghana, Medicine
4. `coastal erosion climate adaptation` — Benin, Environmental Science
5. `machine learning crop disease` — Kenya, Computer Science

The initial top-award range was 67–83 for strong matches across the five searches. Topic data was missing on some otherwise relevant awards, which is why topic absence is uncertain rather than a zero. Only about three of the 25 inspected top funders had any recorded award-country evidence, and none matched the applicant country. Geography therefore remains a ranking signal instead of a hard filter, and every funder explicitly reports whether its country evidence is matched, outside, mixed, or missing.

The retained evaluation snapshot records graded funder judgments, representative award titles, result counts, and API cost. `bun run calibrate:recorded` checks adaptive retrieval against the snapshot, while `bun run calibrate:ranking` grid-searches title and multi-award support weights. Changes must not regress an individual case merely to improve the mean.

Two proposed changes were rejected after evaluation:

- A separate multi-award support bonus did not improve nDCG beyond title evidence.
- A hard award-score floor could remove a relevant digital maternal-health award scored at 68 while retaining an unrelated machine-learning award scored at 71. No score floor is applied.

## Limitations

- OpenAlex relevance is relative to each result set and is normalized against the strongest retrieved award.
- Keyword overlap does not understand synonyms or deeper semantic relationships.
- Semantic retrieval inspects only the requested top works, and many works have no linked award, so it can legitimately add no candidates.
- Institution country records describe historical award evidence, not applicant eligibility.
- Amounts remain in their source currencies and are never added across currencies.
- Metadata completeness affects confidence in the evidence, not the scientific quality of the work.

Revisit weights after five real-user sessions. Preserve the calibration cases when changing the formula so changes can be compared against the same research intents.
