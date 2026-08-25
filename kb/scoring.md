# Matching score

## Purpose

The score ranks historical awards for one research description. It is an evidence-ranking aid, not an eligibility or funding-probability estimate.

Every result must expose the component scores and their explanations. Missing geography stays neutral rather than being treated as evidence that a funder does not support a country.

## Candidate retrieval

Candidate discovery combines two OpenAlex paths before scoring:

- Keyword search over awards retrieves records with direct textual overlap.
- Semantic search over works finds conceptually related publications, then hydrates only their linked OpenAlex awards.

The two ranked lists are fused with reciprocal-rank scores using an offset of 60. Raw OpenAlex keyword and semantic relevance values are not mixed because they use different, query-relative scales. Continuation records are deduplicated after fusion, and semantic work provenance remains attached to the combined retrieval result.

Keyword retrieval runs first. Semantic retrieval is added only when keyword search returns fewer than 15 candidates or its strongest unboosted funder evidence score is below 70. The gate uses the same 60% strongest-award and 40% top-three-award aggregation as the funder score, before title evidence is added, so a verbose matching title cannot suppress semantic retrieval. On the original five-case calibration set, this policy matched full semantic retrieval at nDCG@5 0.849 and precision@5 0.880 while reducing modeled OpenAlex cost by 55%. It runs semantic retrieval for two of the five cases. The thresholds must be reevaluated as the labeled calibration set grows.

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

A funder's score combines its strongest award (60%) with the mean of its three strongest awards (40%). Up to eight additional points come from exact important-term coverage in the best award title, and the matched terms remain visible in the explanation. Titles with more than 24 unique important terms receive a proportional length discount so unusually verbose records cannot earn full title evidence merely by containing many words. Pivots from 16 through 48 preserved every established case; 24 was retained as the conservative midpoint. On the recorded five-case calibration set, title evidence keeps mean nDCG@5 at 0.914 without regressing an individual case. A separate multi-award support bonus did not improve the metric and was not retained.

Continuation records are merged conservatively using funder, normalized award number, and normalized title. Every underlying source record, amount, provenance value, and source link remains attached to the merged candidate.

## Initial calibration

Calibrated against live OpenAlex award searches on 2026-08-25:

1. `pregnancy malaria vaccine` — Benin, Medicine
2. `climate resilient maize farming` — Nigeria, Agricultural and Biological Sciences
3. `maternal health digital interventions` — Ghana, Medicine
4. `coastal erosion climate adaptation` — Benin, Environmental Science
5. `machine learning crop disease` — Kenya, Computer Science

The initial top-award range was 67–83 for strong matches across the five searches. Topic data was missing on some otherwise relevant awards, which is why topic absence is uncertain rather than a zero. Only about three of the 25 inspected top funders had any recorded award-country evidence, and none matched the applicant country. Geography therefore remains a ranking signal instead of a hard filter, and every funder explicitly reports whether its country evidence is matched, outside, mixed, or missing.

The retained evaluation snapshot records graded funder judgments, representative award titles, result counts, and API cost. `bun run calibrate:recorded` checks adaptive retrieval against the snapshot, `bun run calibrate:ranking` grid-searches title and multi-award support weights, and `bun run calibrate:joint` evaluates retrieval thresholds and title weight together when the required evidence is available. Changes must not regress an individual case merely to improve the mean.

A separate regression case records the exact query `Community health workers improving maternal care in rural Benin` with country `BJ` and field `Medicine`. Its inspected keyword result placed an irrelevant CDC award first: a 3,997-character COVID-19 title incidentally matched six query terms and raised the funder score from 71 to 77. Semantic retrieval alone expanded the result from 14 to 26 awards but left CDC first. Raising the sparse-result threshold from 10 to 15 candidates triggered that retrieval without increasing modeled cost on the original cases. Combining it with title-length normalization moved the two directly relevant maternal-health funders above CDC and reduced CDC's score to 72. Across ten judged funders, nDCG@5 rose from 0.675 to 0.902 while precision@5 remained 0.800. `bun run calibrate:regressions` preserves both rankings and the verbose-title failure.

The joint evaluator confirms that title weight 8 remains the best non-regressing recorded option. However, the historical snapshot has complete reranking evidence for combined retrieval and none for the keyword-only runs. It therefore reports adaptive policies with nonzero title weight as not evaluable instead of substituting combined evidence. The separate Benin regression supplies a paired keyword/combined check for the long-title failure, but future calibration runs should still record complete keyword evidence for every case.

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
