# Matching score

## Purpose

The score ranks historical awards for one research description. It is an evidence-ranking aid, not an eligibility or funding-probability estimate.

Every result must expose the component scores and their explanations. Missing geography stays neutral rather than being treated as evidence that a funder does not support a country.

## Candidate retrieval

Candidate discovery combines two OpenAlex paths before scoring:

- Keyword search over awards retrieves records with direct textual overlap.
- Semantic search over works finds conceptually related publications, then hydrates only their linked OpenAlex awards.

The two ranked lists are fused with reciprocal-rank scores using an offset of 60. Raw OpenAlex keyword and semantic relevance values are not mixed because they use different, query-relative scales. Continuation records are deduplicated after fusion, and semantic work provenance remains attached to the combined retrieval result.

Either path may fail independently. A semantic rate limit or an empty set of award-linked works falls back to keyword evidence; a keyword failure can still return hydrated semantic awards. The search fails only when both retrieval paths fail.

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

A funder's score combines its strongest award (60%) with the mean of its three strongest awards (40%). This rewards repeated evidence without allowing funders with many weak records to dominate.

Continuation records are merged conservatively using funder, normalized award number, and normalized title. Every underlying source record, amount, provenance value, and source link remains attached to the merged candidate.

## Initial calibration

Calibrated against live OpenAlex award searches on 2026-08-25:

1. `pregnancy malaria vaccine` — Benin, Medicine
2. `climate resilient maize farming` — Nigeria, Agricultural and Biological Sciences
3. `maternal health digital interventions` — Ghana, Medicine
4. `coastal erosion climate adaptation` — Benin, Environmental Science
5. `machine learning crop disease` — Kenya, Computer Science

The initial top-award range was 67–83 for strong matches across the five searches. Topic data was missing on some otherwise relevant awards, which is why topic absence is uncertain rather than a zero. Geography was also frequently missing, confirming that country should remain a ranking signal instead of a hard retrieval filter.

## Limitations

- OpenAlex relevance is relative to each result set and is normalized against the strongest retrieved award.
- Keyword overlap does not understand synonyms or deeper semantic relationships.
- Semantic retrieval inspects only the requested top works, and many works have no linked award, so it can legitimately add no candidates.
- Institution country records describe historical award evidence, not applicant eligibility.
- Amounts remain in their source currencies and are never added across currencies.
- Metadata completeness affects confidence in the evidence, not the scientific quality of the work.

Revisit weights after five real-user sessions. Preserve the calibration cases when changing the formula so changes can be compared against the same research intents.
