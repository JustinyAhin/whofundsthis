<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { getAwardDisplay } from '$lib/award-display';
	import SearchForm from '$lib/components/search-form.svelte';
	import Seo from '$lib/components/seo.svelte';
	import { getFundingResults } from '$lib/remote-functions/funding-search.remote';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const description = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const countryCode = $derived(page.url.searchParams.get('country')?.trim().toUpperCase() ?? '');
	const field = $derived(page.url.searchParams.get('field')?.trim() ?? '');
	let visibleFunderCount = $state(10);
	const resultQuery = $derived(
		description
			? getFundingResults({
					description,
					countryCode,
					field
				})
			: null
	);

	const dimensionLabels: Record<string, string> = {
		textRelevance: 'Text',
		topicOverlap: 'Topics',
		geography: 'Geography',
		recency: 'Recency',
		metadataConfidence: 'Evidence'
	};

	const formatFundingRange = ({
		currency,
		minimum,
		maximum
	}: {
		currency: string;
		minimum: number;
		maximum: number;
	}) => {
		const formatter = new Intl.NumberFormat('en', {
			style: 'currency',
			currency,
			notation: 'compact',
			maximumFractionDigits: 1
		});

		return minimum === maximum
			? formatter.format(minimum)
			: `${formatter.format(minimum)}–${formatter.format(maximum)}`;
	};

	const formatAwardAmount = ({
		amount,
		currency
	}: {
		amount: number | null;
		currency: string | null;
	}) => {
		if (amount === null || !currency) return 'Amount unavailable';

		return new Intl.NumberFormat('en', {
			style: 'currency',
			currency,
			notation: 'compact',
			maximumFractionDigits: 1
		}).format(amount);
	};

	const formatYearRange = ({
		minimum,
		maximum
	}: {
		minimum: number | null;
		maximum: number | null;
	}) => {
		if (minimum === null || maximum === null) return 'Years unavailable';
		return minimum === maximum ? String(minimum) : `${minimum}–${maximum}`;
	};

	const getScoreDimensions = (
		dimensions: Record<
			string,
			{
				score: number;
				weight: number;
				contribution: number;
				explanation: string;
				evidence: string[];
			}
		>
	) =>
		Object.entries(dimensions)
			.filter(([, dimension]) => dimension.weight > 0)
			.map(([name, dimension]) => ({ name, label: dimensionLabels[name] ?? name, ...dimension }));

	const getFunderDetailUrl = (funderId: string) => {
		const search = new SvelteURLSearchParams({ q: description });
		if (countryCode) search.set('country', countryCode);
		if (field) search.set('field', field);

		return `${resolve('/results/funders/[funderId]', { funderId })}?${search.toString()}` as ResolvedPathname;
	};
</script>

<Seo
	title={`${description ? `Funding matches for ${description}` : 'Funding search'} — Who Funds This?`}
	description="Evidence-backed historical funder matches from OpenAlex awards."
	canonical="/results"
	robots="noindex,nofollow"
/>

<section class="results-search">
	<div class="site-shell">
		<p class="eyebrow">Refine this search</p>
		<SearchForm {description} {countryCode} {field} compact />
	</div>
</section>

<div class="site-shell results-shell">
	{#if !description}
		<section class="empty-state">
			<p class="eyebrow">No research description</p>
			<h1>Start with a short description of your research.</h1>
			<a href={resolve('/')}>Go to the search form</a>
		</section>
	{:else if resultQuery}
		{#await resultQuery}
			<section class="loading-state" aria-live="polite">
				<div class="loading-heading"></div>
				<div class="loading-line"></div>
				<div class="loading-grid">
					<div></div>
					<div></div>
					<div></div>
				</div>
				<p>Searching historical awards and comparing the evidence…</p>
			</section>
		{:then result}
			<header class="results-heading">
				<div>
					<p class="eyebrow">Historical funding matches</p>
					<h1>{result.meta.funderCount} funders for “{result.query.description}”</h1>
					<p>
						Ranked from {result.meta.candidateCount} distinct awards. Scores explain similarity—not eligibility
						or the likelihood of future funding.
					</p>
				</div>
				<div class="results-context">
					{#if result.query.countryCode}
						<span>Country <strong>{result.query.countryCode}</strong></span>
					{/if}
					{#if result.query.field}
						<span>Field <strong>{result.query.field}</strong></span>
					{/if}
					<span>Source <strong>OpenAlex</strong></span>
				</div>
			</header>

			{#if result.funders.length === 0}
				<section class="empty-state">
					<p class="eyebrow">No strong evidence yet</p>
					<h2>Try a shorter or broader description.</h2>
					<p>OpenAlex did not return funder-linked awards for this wording.</p>
				</section>
			{:else}
				<div class="results-layout">
					<aside class="score-guide">
						<p class="aside-title">How to read this</p>
						<p>The overall score combines text, topic, geography, recency, and evidence quality.</p>
						<ul>
							<li><i class="high"></i><span><strong>75–100</strong> Strong evidence</span></li>
							<li><i class="medium"></i><span><strong>55–74</strong> Worth exploring</span></li>
							<li><i class="low"></i><span><strong>Below 55</strong> Limited evidence</span></li>
						</ul>
						<p class="coverage-note">
							{result.meta.deduplicatedAwardCount} continuation or duplicate records were merged.
						</p>
					</aside>

					<div class="funder-list">
						{#each result.funders.slice(0, visibleFunderCount) as funder, index (funder.id)}
							<article class="funder-card">
								<header class="funder-header">
									<div class="rank">{String(index + 1).padStart(2, '0')}</div>
									<div class="funder-name">
										<p>
											{funder.matchingAwardCount} matching award{funder.matchingAwardCount === 1
												? ''
												: 's'}
										</p>
										<h2><a href={getFunderDetailUrl(funder.id)}>{funder.name}</a></h2>
									</div>
									<div
										class:strong-score={funder.score.total >= 75}
										class="total-score"
										aria-label={`Match score ${funder.score.total} out of 100`}
									>
										<strong>{funder.score.total}</strong><span>/100</span>
									</div>
								</header>

								<div class="funder-stats">
									<div>
										<span>Award evidence</span><strong>{funder.evidenceRecordCount} records</strong>
									</div>
									<div>
										<span>Recorded years</span><strong
											>{formatYearRange(funder.awardYearRange)}</strong
										>
									</div>
									<div>
										<span>Funding range</span>
										<strong>
											{funder.fundingRanges[0]
												? formatFundingRange(funder.fundingRanges[0])
												: 'Unavailable'}
										</strong>
									</div>
									<div><span>Linked outputs</span><strong>{funder.fundedOutputsCount}</strong></div>
								</div>

								<div class="why-block">
									<p>Why this funder appears</p>
									<ul>
										{#each funder.whyThisFunder as reason (reason)}
											<li>{reason}</li>
										{/each}
									</ul>
									{#if result.query.countryCode && funder.score.geographyEvidence.status === 'missing'}
										<p>
											Country evidence is unavailable for these awards; this is not evidence of
											eligibility.
										</p>
									{:else if result.query.countryCode && funder.score.geographyEvidence.status === 'outside'}
										<p>
											Recorded award institutions are outside {result.query.countryCode};
											eligibility is unknown.
										</p>
									{:else if result.query.countryCode && funder.score.geographyEvidence.matchedAwardCount > 0}
										<p>
											{funder.score.geographyEvidence.matchedAwardCount} award{funder.score
												.geographyEvidence.matchedAwardCount === 1
												? ''
												: 's'} include recorded institution evidence for {result.query.countryCode}.
										</p>
									{/if}
								</div>

								<div class="award-evidence">
									<p class="evidence-title">Representative award evidence</p>
									{#each funder.representativeAwards as award (award.candidate.id)}
										{@const awardDisplay = getAwardDisplay({
											title: award.candidate.title,
											description: award.candidate.description,
											scheme: award.candidate.funding.scheme,
											funderAwardId: award.candidate.funderAwardId
										})}
										<details>
											<summary>
												<div>
													<strong>{awardDisplay.title}</strong>
													<span>
														{formatAwardAmount({
															amount: award.candidate.funding.amount,
															currency: award.candidate.funding.currency
														})}
														· {formatYearRange({
															minimum: award.candidate.period.startYear,
															maximum: award.candidate.period.endYear
														})}
													</span>
												</div>
												<b>{award.score.total}</b>
											</summary>
											<div class="award-detail">
												{#if awardDisplay.description}
													<p class="award-description-label">Award description</p>
													<p class="award-description">{awardDisplay.description}</p>
												{/if}
												<div class="score-bars">
													{#each getScoreDimensions(award.score.dimensions) as dimension (dimension.name)}
														<div class="score-row" title={dimension.explanation}>
															<span>{dimension.label}</span>
															<i><b style={`width: ${Math.round(dimension.score * 100)}%`}></b></i>
															<strong>{Math.round(dimension.score * 100)}</strong>
														</div>
													{/each}
												</div>
												<div class="award-links">
													<a
														href={award.candidate.sources[0]?.landingPageUrl ??
															award.candidate.openAlexUrl}
														target="_blank"
														rel="external noreferrer"
													>
														Original award source ↗
													</a>
													<a
														href={award.candidate.openAlexUrl}
														target="_blank"
														rel="external noreferrer">OpenAlex record ↗</a
													>
													{#if award.candidate.outputs[0]}
														<a
															href={award.candidate.outputs[0].url}
															target="_blank"
															rel="external noreferrer">View linked output ↗</a
														>
													{/if}
												</div>
											</div>
										</details>
									{/each}
								</div>

								{#if funder.countries.length || funder.institutions.length || funder.schemes.length}
									<footer class="evidence-tags">
										{#each funder.countries.slice(0, 4) as country (country)}<span>{country}</span
											>{/each}
										{#each funder.schemes.slice(0, 3) as scheme (scheme)}<span>{scheme}</span
											>{/each}
										{#each funder.institutions.slice(0, 2) as institution (institution)}<span
												>{institution}</span
											>{/each}
									</footer>
								{/if}
							</article>
						{/each}
						{#if visibleFunderCount < result.funders.length}
							<button
								class="show-more"
								type="button"
								onclick={() => (visibleFunderCount = result.funders.length)}
							>
								Show {result.funders.length - visibleFunderCount} more funders
							</button>
						{/if}
					</div>
				</div>
			{/if}
		{:catch searchError}
			<section class="empty-state error-state">
				<p class="eyebrow">Search unavailable</p>
				<h1>We couldn’t retrieve the award evidence.</h1>
				<p>{searchError?.message ?? 'Please wait a moment and try again.'}</p>
				<a href={resolve('/')}>Start a new search</a>
			</section>
		{/await}
	{/if}
</div>

<style>
	.eyebrow {
		margin: 0 0 0.7rem;
		color: var(--green);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.results-search {
		border-bottom: 1px solid var(--line);
		padding: 1.5rem 0 1.7rem;
		background: white;
	}

	.results-shell {
		padding-top: 3.25rem;
	}

	.results-heading {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 3rem;
		align-items: end;
		padding-bottom: 2.25rem;
		border-bottom: 1px solid var(--line-strong);
	}

	.results-heading h1,
	.empty-state h1,
	.empty-state h2 {
		max-width: 22ch;
		margin: 0 0 0.75rem;
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: clamp(2.2rem, 4vw, 3.5rem);
		font-weight: 500;
		letter-spacing: -0.035em;
		line-height: 1.04;
	}

	.results-heading > div > p:last-child {
		max-width: 48rem;
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
		line-height: 1.65;
	}

	.results-context {
		display: grid;
		gap: 0.45rem;
		min-width: 13rem;
		padding: 0.35rem 0 0.35rem 1.1rem;
		border-left: 2px solid var(--line-strong);
		font-size: 0.8rem;
	}

	.results-context span {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: var(--ink-muted);
	}

	.results-context strong {
		max-width: 12rem;
		overflow: hidden;
		color: var(--ink-strong);
		font-weight: 700;
		text-align: right;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.results-layout {
		display: grid;
		grid-template-columns: 13.5rem minmax(0, 1fr);
		gap: 2.5rem;
		align-items: start;
		padding-top: 2.25rem;
	}

	.score-guide {
		position: sticky;
		top: 1.5rem;
		color: var(--ink-muted);
		font-size: 0.78rem;
		line-height: 1.6;
	}

	.aside-title {
		margin: 0 0 0.55rem;
		color: var(--ink-strong);
		font-weight: 760;
	}

	.score-guide > p {
		margin-top: 0;
	}

	.score-guide ul {
		display: grid;
		gap: 0.7rem;
		margin: 1.2rem 0;
		padding: 0;
		list-style: none;
	}

	.score-guide li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.score-guide i {
		width: 0.48rem;
		height: 0.48rem;
		border-radius: 50%;
		background: #a8afa9;
	}

	.score-guide i.high {
		background: var(--green);
	}

	.score-guide i.medium {
		background: var(--gold);
	}

	.coverage-note {
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.funder-list {
		display: grid;
		gap: 1.25rem;
	}

	.show-more {
		width: 100%;
		border: 1px solid var(--line-strong);
		border-radius: 0.25rem;
		padding: 0.9rem 1rem;
		background: white;
		color: var(--green);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 720;
		cursor: pointer;
	}

	.show-more:hover {
		border-color: var(--green);
		background: var(--green-soft);
	}

	.funder-card {
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		background: var(--surface);
		box-shadow: none;
	}

	.funder-header {
		display: grid;
		grid-template-columns: 2.4rem minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
		padding: 1.4rem 1.5rem 1.2rem;
	}

	.rank {
		align-self: start;
		padding-top: 0.15rem;
		color: var(--gold);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.funder-name p,
	.evidence-title {
		margin: 0 0 0.3rem;
		color: var(--ink-muted);
		font-size: 0.75rem;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.funder-name h2 {
		margin: 0;
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: clamp(1.35rem, 3vw, 1.85rem);
		font-weight: 500;
		letter-spacing: -0.025em;
	}

	.funder-name h2 a {
		color: inherit;
		text-decoration-color: transparent;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.funder-name h2 a:hover {
		text-decoration-color: var(--green);
	}

	.total-score {
		display: flex;
		align-items: baseline;
		min-width: 4.7rem;
		justify-content: flex-end;
		border-left: 3px solid var(--gold);
		padding: 0.35rem 0 0.35rem 0.8rem;
		color: var(--gold);
	}

	.total-score.strong-score {
		background: transparent;
		border-left-color: var(--green);
		color: var(--green-dark);
	}

	.total-score strong {
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.55rem;
	}

	.total-score span {
		font-size: 0.65rem;
	}

	.funder-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-block: 1px solid var(--line);
		background: #f7f9fc;
	}

	.funder-stats div {
		padding: 0.85rem 1rem;
		border-right: 1px solid var(--line);
	}

	.funder-stats div:last-child {
		border-right: 0;
	}

	.funder-stats span,
	.funder-stats strong {
		display: block;
	}

	.funder-stats span {
		margin-bottom: 0.28rem;
		color: var(--ink-muted);
		font-size: 0.75rem;
	}

	.funder-stats strong {
		color: var(--ink-strong);
		font-size: 0.78rem;
		font-weight: 730;
	}

	.why-block {
		display: grid;
		grid-template-columns: 10rem 1fr;
		gap: 1.5rem;
		padding: 1.25rem 1.5rem;
	}

	.why-block > p {
		margin: 0;
		color: var(--green);
		font-size: 0.72rem;
		font-weight: 760;
	}

	.why-block ul {
		display: grid;
		gap: 0.4rem;
		margin: 0;
		padding-left: 1rem;
		color: var(--ink);
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.award-evidence {
		padding: 0.25rem 1.5rem 1.1rem;
	}

	.evidence-title {
		margin-bottom: 0.55rem;
	}

	details {
		border-top: 1px solid var(--line);
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 0;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary > div {
		display: grid;
		gap: 0.25rem;
	}

	summary strong {
		display: -webkit-box;
		overflow: hidden;
		color: var(--ink-strong);
		font-size: 0.86rem;
		font-weight: 690;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	summary span {
		color: var(--ink-muted);
		font-size: 0.7rem;
	}

	summary > b {
		display: grid;
		min-width: 2.2rem;
		height: 2.2rem;
		place-items: center;
		border-left: 2px solid var(--green);
		color: var(--green);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 0.8rem;
	}

	.award-detail {
		padding: 0.25rem 0 1.15rem;
	}

	.award-description-label {
		margin: 0 0 0.3rem;
		color: var(--ink-strong);
		font-size: 0.7rem;
		font-weight: 760;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.award-description {
		display: -webkit-box;
		overflow: hidden;
		margin: 0 0 1rem;
		color: var(--ink-muted);
		font-size: 0.78rem;
		line-height: 1.6;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		line-clamp: 4;
	}

	.score-bars {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem 1.2rem;
		margin-bottom: 1rem;
	}

	.score-row {
		display: grid;
		grid-template-columns: 4.5rem 1fr 1.5rem;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.73rem;
	}

	.score-row > span {
		color: var(--ink-muted);
	}

	.score-row > i {
		display: block;
		overflow: hidden;
		height: 0.28rem;
		border-radius: 999px;
		background: var(--surface-muted);
	}

	.score-row > i b {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--green);
	}

	.score-row > strong {
		color: var(--ink-strong);
		font-weight: 700;
		text-align: right;
	}

	.award-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem 1rem;
	}

	.award-links a {
		color: var(--green);
		font-size: 0.7rem;
		font-weight: 700;
		text-underline-offset: 0.2rem;
	}

	.evidence-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding: 0.8rem 1.5rem;
		border-top: 1px solid var(--line);
		background: #f7f9fc;
	}

	.evidence-tags span {
		max-width: 14rem;
		overflow: hidden;
		border-radius: 0.2rem;
		padding: 0.25rem 0.55rem;
		background: var(--surface-muted);
		color: var(--ink-muted);
		font-size: 0.72rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.loading-state,
	.empty-state {
		max-width: 52rem;
		margin: 5rem auto;
		text-align: center;
	}

	.loading-state p,
	.empty-state > p:not(.eyebrow) {
		color: var(--ink-muted);
	}

	.empty-state h1,
	.empty-state h2 {
		max-width: 19ch;
		margin-inline: auto;
	}

	.empty-state a {
		display: inline-block;
		margin-top: 1rem;
		border-radius: 0.7rem;
		padding: 0.75rem 1rem;
		background: var(--green);
		color: white;
		font-size: 0.8rem;
		font-weight: 700;
		text-decoration: none;
	}

	.loading-heading,
	.loading-line,
	.loading-grid div {
		border-radius: 0.5rem;
		background: linear-gradient(90deg, #e4e2da, #f5f3ec, #e4e2da);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.loading-heading {
		width: 70%;
		height: 3rem;
		margin: 0 auto 1rem;
	}

	.loading-line {
		width: 45%;
		height: 0.8rem;
		margin: 0 auto 3rem;
	}

	.loading-grid {
		display: grid;
		gap: 1rem;
	}

	.loading-grid div {
		height: 8rem;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	@media (max-width: 900px) {
		.results-layout {
			grid-template-columns: 1fr;
		}

		.score-guide {
			position: static;
			display: none;
		}

		.results-heading {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.results-context {
			min-width: 0;
		}
	}

	@media (max-width: 680px) {
		.results-shell {
			padding-top: 2rem;
		}

		.funder-header {
			grid-template-columns: 1.7rem minmax(0, 1fr) auto;
			padding-inline: 1rem;
		}

		.funder-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.funder-stats div:nth-child(2) {
			border-right: 0;
		}

		.funder-stats div:nth-child(-n + 2) {
			border-bottom: 1px solid var(--line);
		}

		.why-block {
			grid-template-columns: 1fr;
			gap: 0.5rem;
			padding-inline: 1rem;
		}

		.award-evidence {
			padding-inline: 1rem;
		}

		.score-bars {
			grid-template-columns: 1fr;
		}
	}
</style>
