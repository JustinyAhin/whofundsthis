<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Seo from '$lib/components/seo.svelte';
	import { getFundingResults } from '$lib/remote-functions/funding-search.remote';
	import type { FunderMatch, FunderMatchSearchResult } from '$lib/server/funders/types';
	import type { ScoreDimension } from '$lib/server/scoring/types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const dimensionLabels: Record<string, string> = {
		textRelevance: 'Text relevance',
		topicOverlap: 'Topic overlap',
		geography: 'Geography',
		recency: 'Recency',
		metadataConfidence: 'Evidence quality'
	};

	const getSafeFunderId = (value: string | undefined) => {
		if (!value) return null;

		let decodedValue: string;
		try {
			decodedValue = decodeURIComponent(value).trim();
		} catch {
			return null;
		}

		const match = decodedValue.match(/(?:^|\/)F(\d+)$/i);
		return match ? `F${match[1]}` : null;
	};

	const getResultsUrl = ({
		description,
		countryCode,
		field
	}: {
		description: string;
		countryCode: string;
		field: string;
	}): `/results?${string}` => {
		const search = new SvelteURLSearchParams();
		if (description) search.set('q', description);
		if (countryCode) search.set('country', countryCode);
		if (field) search.set('field', field);

		return `/results?${search.toString()}`;
	};

	const selectFunder = ({
		result,
		id
	}: {
		result: FunderMatchSearchResult;
		id: string;
	}): FunderMatch | null =>
		result.funders.find((funder) => funder.id.toUpperCase() === id.toUpperCase()) ?? null;

	const formatCurrency = ({ amount, currency }: { amount: number; currency: string }) => {
		try {
			return new Intl.NumberFormat('en', {
				style: 'currency',
				currency,
				notation: 'compact',
				maximumFractionDigits: 1
			}).format(amount);
		} catch {
			return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(amount)} ${currency}`;
		}
	};

	const formatFundingRange = ({
		currency,
		minimum,
		maximum
	}: {
		currency: string;
		minimum: number;
		maximum: number;
	}) =>
		minimum === maximum
			? formatCurrency({ amount: minimum, currency })
			: `${formatCurrency({ amount: minimum, currency })}\u2013${formatCurrency({ amount: maximum, currency })}`;

	const formatAwardAmount = ({
		amount,
		currency
	}: {
		amount: number | null;
		currency: string | null;
	}) => (amount !== null && currency ? formatCurrency({ amount, currency }) : 'Amount unavailable');

	const formatYearRange = ({
		minimum,
		maximum
	}: {
		minimum: number | null;
		maximum: number | null;
	}) => {
		if (minimum === null && maximum === null) return 'Years unavailable';
		if (minimum === null) return `Through ${maximum}`;
		if (maximum === null) return `From ${minimum}`;
		return minimum === maximum ? String(minimum) : `${minimum}\u2013${maximum}`;
	};

	const getScoreDimensions = (dimensions: Record<string, ScoreDimension>) =>
		Object.entries(dimensions)
			.filter(([, dimension]) => dimension.weight > 0)
			.map(([name, dimension]) => ({ name, label: dimensionLabels[name] ?? name, ...dimension }));

	const description = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const countryCode = $derived(page.url.searchParams.get('country')?.trim().toUpperCase() ?? '');
	const field = $derived(page.url.searchParams.get('field')?.trim() ?? '');
	const funderId = $derived(getSafeFunderId(page.params.funderId));
	const resultsUrl = $derived(getResultsUrl({ description, countryCode, field }));
	const resultQuery = $derived(
		description.length >= 12 && funderId
			? getFundingResults({ description, countryCode, field })
			: null
	);
</script>

<Seo
	title="Funder evidence — Who Funds This?"
	description="Historical awards and source evidence supporting this funder match."
	robots="noindex,nofollow"
/>

<div class="site-shell detail-shell">
	<a class="back-link" href={resolve(resultsUrl)}>← Back to all funder matches</a>

	{#if !description || description.length < 12}
		<section class="state-card">
			<p class="eyebrow">Search context missing</p>
			<h1>This funder detail needs the original research description.</h1>
			<p>Return to the matcher and start a new evidence search.</p>
			<a class="action-link" href={resolve('/')}>Start a new search</a>
		</section>
	{:else if !funderId}
		<section class="state-card">
			<p class="eyebrow">Invalid funder</p>
			<h1>We couldn’t identify this funder.</h1>
			<p>The funder identifier in this link is missing or malformed.</p>
			<a class="action-link" href={resolve(resultsUrl)}>Return to results</a>
		</section>
	{:else if resultQuery}
		{#await resultQuery}
			<section class="state-card loading-state" aria-live="polite" aria-busy="true">
				<div class="loading-title"></div>
				<div class="loading-line"></div>
				<div class="loading-panels"><i></i><i></i><i></i></div>
				<p>Reconstructing this search and gathering the supporting evidence…</p>
			</section>
		{:then result}
			{@const funder = selectFunder({ result, id: funderId })}
			{#if !funder}
				<section class="state-card">
					<p class="eyebrow">Funder not found</p>
					<h1>This funder is not part of the reconstructed result set.</h1>
					<p>The underlying OpenAlex results may have changed since this link was created.</p>
					<a class="action-link" href={resolve(resultsUrl)}>View current results</a>
				</section>
			{:else}
				<header class="detail-heading">
					<div>
						<p class="eyebrow">Historical funder evidence</p>
						<h1>{funder.name}</h1>
						<p class="query-copy">Evidence for “{result.query.description}”</p>
					</div>
					<div
						class:strong-score={funder.score.total >= 75}
						class="total-score"
						aria-label={`Match score ${funder.score.total} out of 100`}
					>
						<strong>{funder.score.total}</strong><span>/100</span><small>match score</small>
					</div>
				</header>

				<section class="summary-grid" aria-label="Funder evidence summary">
					<div><span>Matching awards</span><strong>{funder.matchingAwardCount}</strong></div>
					<div><span>Source records</span><strong>{funder.evidenceRecordCount}</strong></div>
					<div>
						<span>Recorded years</span>
						<strong>{formatYearRange(funder.awardYearRange)}</strong>
					</div>
					<div><span>Linked outputs</span><strong>{funder.fundedOutputsCount}</strong></div>
				</section>

				<div class="detail-layout">
					<main class="evidence-column">
						<section class="panel why-panel">
							<p class="section-label">Why this funder appears</p>
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
									Recorded award institutions are outside {result.query.countryCode}; eligibility is
									unknown.
								</p>
							{:else if result.query.countryCode && funder.score.geographyEvidence.matchedAwardCount > 0}
								<p>
									{funder.score.geographyEvidence.matchedAwardCount} award{funder.score
										.geographyEvidence.matchedAwardCount === 1
										? ''
										: 's'} include recorded institution evidence for {result.query.countryCode}.
								</p>
							{/if}
						</section>

						<section class="panel">
							<header class="section-heading">
								<div>
									<p class="section-label">Score breakdown</p>
									<h2>What shaped the match</h2>
								</div>
								<p>Average evidence across the strongest matching awards.</p>
							</header>
							<div class="dimension-list">
								{#each Object.entries(funder.score.dimensions).filter(([name]) => name !== 'geography' || Boolean(result.query.countryCode)) as [name, score] (name)}
									<div class="dimension-row">
										<span>{dimensionLabels[name] ?? name}</span>
										<i><b style={`width: ${Math.round(score * 100)}%`}></b></i>
										<strong>{Math.round(score * 100)}</strong>
									</div>
								{/each}
							</div>
						</section>

						<section class="awards-section">
							<header class="section-heading awards-heading">
								<div>
									<p class="section-label">Matching award evidence</p>
									<h2>Strongest historical records</h2>
								</div>
								<p>
									Showing {funder.representativeAwards.length} of {funder.matchingAwardCount} matching
									awards.
								</p>
							</header>

							<div class="award-list">
								{#each funder.representativeAwards as award, index (award.candidate.id)}
									<article class="award-card">
										<header>
											<div>
												<p>Award {String(index + 1).padStart(2, '0')}</p>
												<h3>{award.candidate.title ?? 'Untitled award'}</h3>
											</div>
											<span class="award-score">{award.score.total}/100</span>
										</header>

										<div class="award-facts">
											<span
												>{formatAwardAmount({
													amount: award.candidate.funding.amount,
													currency: award.candidate.funding.currency
												})}</span
											>
											<span
												>{formatYearRange({
													minimum: award.candidate.period.startYear,
													maximum: award.candidate.period.endYear
												})}</span
											>
											{#if award.candidate.funding.scheme}<span
													>{award.candidate.funding.scheme}</span
												>{/if}
											{#if award.candidate.funderAwardId}<span
													>Ref. {award.candidate.funderAwardId}</span
												>{/if}
										</div>

										{#if award.candidate.description}
											<details class="description-disclosure">
												<summary>Read award description</summary>
												<p class="award-description">{award.candidate.description}</p>
											</details>
										{/if}

										<div class="award-dimensions">
											{#each getScoreDimensions(award.score.dimensions) as dimension (dimension.name)}
												<div>
													<span>{dimension.label}</span>
													<strong>{Math.round(dimension.score * 100)}</strong>
													<p>{dimension.explanation}</p>
												</div>
											{/each}
										</div>

										{#if award.candidate.institutions.length || award.candidate.countryCodes.length}
											<div class="award-context">
												{#each award.candidate.institutions as institution (institution.id)}
													<span>{institution.name}</span>
												{/each}
												{#each award.candidate.countryCodes as country (country)}
													<span>{country}</span>
												{/each}
											</div>
										{/if}

										{#if award.candidate.outputs.length}
											<section class="outputs">
												<h4>Linked research outputs</h4>
												<ul>
													{#each award.candidate.outputs as output (output.id)}
														<li>
															<a href={output.url} target="_blank" rel="external noreferrer"
																>{output.id} ↗</a
															>
														</li>
													{/each}
												</ul>
											</section>
										{/if}

										<section class="provenance">
											<h4>Source provenance</h4>
											<div class="source-list">
												{#each award.candidate.sources as source (source.openAlexId)}
													<div class="source-record">
														<div>
															<strong>{source.provenance ?? 'OpenAlex award record'}</strong>
															<span>{source.openAlexId}</span>
														</div>
														<div class="source-links">
															{#if source.landingPageUrl}<a
																	href={source.landingPageUrl}
																	target="_blank"
																	rel="external noreferrer">Original source ↗</a
																>{/if}
															<a href={source.openAlexUrl} target="_blank" rel="external noreferrer"
																>OpenAlex ↗</a
															>
														</div>
													</div>
												{/each}
											</div>
										</section>
									</article>
								{/each}
							</div>
						</section>
					</main>

					<aside class="context-column">
						<section class="aside-panel">
							<h2>Recorded funding</h2>
							{#if funder.fundingRanges.length}
								<ul class="funding-list">
									{#each funder.fundingRanges as range (range.currency)}
										<li>
											<strong>{formatFundingRange(range)}</strong>
											<span
												>{range.awardCount} source record{range.awardCount === 1 ? '' : 's'} in {range.currency}</span
											>
										</li>
									{/each}
								</ul>
								<p class="aside-note">Currencies are shown separately and never added together.</p>
							{:else}
								<p class="aside-note">No award amounts were available in these records.</p>
							{/if}
						</section>

						{#if funder.institutions.length}
							<section class="aside-panel">
								<h2>Institutions</h2>
								<ul class="plain-list">
									{#each funder.institutions as institution (institution)}<li>
											{institution}
										</li>{/each}
								</ul>
							</section>
						{/if}

						{#if funder.countries.length || funder.schemes.length}
							<section class="aside-panel">
								<h2>Evidence context</h2>
								{#if funder.countries.length}
									<h3>Countries</h3>
									<div class="tag-list">
										{#each funder.countries as country (country)}<span>{country}</span>{/each}
									</div>
								{/if}
								{#if funder.schemes.length}
									<h3>Schemes</h3>
									<ul class="plain-list">
										{#each funder.schemes as scheme (scheme)}<li>{scheme}</li>{/each}
									</ul>
								{/if}
							</section>
						{/if}

						<section class="aside-panel limitation-panel">
							<h2>How to use this evidence</h2>
							<p>
								This score ranks historical similarity. It does not establish eligibility or predict
								future funding.
							</p>
							<p>
								OpenAlex coverage varies. Missing countries, amounts, or outputs do not mean that no
								evidence exists.
							</p>
							<p>Check the original source before using a record in a funding conversation.</p>
						</section>

						{#if funder.doiUrl}
							<a
								class="external-funder-link"
								href={funder.doiUrl}
								target="_blank"
								rel="external noreferrer">View funder identifier ↗</a
							>
						{/if}
					</aside>
				</div>
			{/if}
		{:catch searchError}
			<section class="state-card error-state">
				<p class="eyebrow">Evidence unavailable</p>
				<h1>We couldn’t reconstruct this funder result.</h1>
				<p>{searchError?.message ?? 'Please wait a moment and try again.'}</p>
				<a class="action-link" href={resolve(resultsUrl)}>Return to results</a>
			</section>
		{/await}
	{/if}
</div>

<style>
	.detail-shell {
		padding-top: 2rem;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 2rem;
		color: var(--green);
		font-size: 0.78rem;
		font-weight: 720;
		text-underline-offset: 0.25rem;
	}

	.eyebrow,
	.section-label {
		margin: 0 0 0.65rem;
		color: var(--green);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.detail-heading {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 2rem;
		align-items: end;
		padding: 0.5rem 0 2rem;
	}

	.detail-heading h1,
	.state-card h1 {
		max-width: 21ch;
		margin: 0;
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: clamp(2.4rem, 4.5vw, 4.25rem);
		font-weight: 500;
		letter-spacing: -0.035em;
		line-height: 1;
	}

	.query-copy {
		max-width: 52rem;
		margin: 1rem 0 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.total-score {
		display: grid;
		grid-template-columns: auto auto;
		align-items: baseline;
		min-width: 8rem;
		border-left: 4px solid var(--gold);
		padding: 0.6rem 0 0.6rem 1.2rem;
		color: var(--gold);
		text-align: center;
	}

	.total-score.strong-score {
		background: transparent;
		border-left-color: var(--green);
		color: var(--green-dark);
	}

	.total-score strong {
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 2.2rem;
	}

	.total-score span {
		font-size: 0.72rem;
	}

	.total-score small {
		grid-column: 1 / -1;
		font-size: 0.72rem;
		font-weight: 760;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-block: 1px solid var(--line-strong);
		background: color-mix(in srgb, var(--surface) 60%, transparent);
	}

	.summary-grid div {
		padding: 1rem 1.25rem;
		border-right: 1px solid var(--line);
	}

	.summary-grid div:last-child {
		border-right: 0;
	}

	.summary-grid span,
	.summary-grid strong {
		display: block;
	}

	.summary-grid span {
		margin-bottom: 0.3rem;
		color: var(--ink-muted);
		font-size: 0.68rem;
	}

	.summary-grid strong {
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.2rem;
		font-weight: 500;
	}

	.detail-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 18rem;
		gap: 2.5rem;
		align-items: start;
		padding-top: 2.5rem;
	}

	.evidence-column,
	.award-list,
	.context-column {
		display: grid;
		gap: 1.2rem;
	}

	.panel,
	.award-card,
	.aside-panel,
	.state-card {
		border: 1px solid var(--line);
		border-radius: 0.25rem;
		background: var(--surface);
		box-shadow: none;
	}

	.panel {
		padding: 1.5rem;
	}

	.why-panel {
		display: grid;
		grid-template-columns: 11rem 1fr;
		gap: 2rem;
	}

	.why-panel ul {
		display: grid;
		gap: 0.55rem;
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.86rem;
		line-height: 1.55;
	}

	.section-heading {
		display: flex;
		justify-content: space-between;
		gap: 2rem;
		align-items: end;
		margin-bottom: 1.4rem;
	}

	.section-heading h2 {
		margin: 0;
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.65rem;
		font-weight: 500;
		letter-spacing: -0.025em;
	}

	.section-heading > p {
		max-width: 18rem;
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.78rem;
		line-height: 1.5;
		text-align: right;
	}

	.dimension-list {
		display: grid;
		gap: 0.75rem;
	}

	.dimension-row {
		display: grid;
		grid-template-columns: 8.5rem 1fr 2rem;
		gap: 0.8rem;
		align-items: center;
		font-size: 0.75rem;
	}

	.dimension-row > span {
		color: var(--ink-muted);
	}

	.dimension-row > i {
		display: block;
		overflow: hidden;
		height: 0.38rem;
		border-radius: 999px;
		background: var(--surface-muted);
	}

	.dimension-row > i b {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--green);
	}

	.dimension-row > strong {
		color: var(--ink-strong);
		text-align: right;
	}

	.awards-section {
		padding-top: 1.6rem;
	}

	.awards-heading {
		padding-inline: 0.2rem;
	}

	.award-card {
		overflow: hidden;
	}

	.award-card > header {
		display: flex;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.35rem 1.5rem 1rem;
	}

	.award-card > header p {
		margin: 0 0 0.35rem;
		color: var(--gold);
		font-size: 0.76rem;
		font-weight: 780;
	}

	.award-card h3 {
		margin: 0;
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.35rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.25;
	}

	.award-score {
		height: fit-content;
		border: 1px solid var(--line-strong);
		border-radius: 0.2rem;
		padding: 0.38rem 0.65rem;
		color: var(--green);
		font-size: 0.72rem;
		font-weight: 760;
		white-space: nowrap;
	}

	.award-facts,
	.award-context {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding: 0 1.5rem 1rem;
	}

	.award-facts span,
	.award-context span,
	.tag-list span {
		border: 1px solid var(--line);
		border-radius: 0.2rem;
		padding: 0.28rem 0.58rem;
		color: var(--ink-muted);
		font-size: 0.74rem;
	}

	.award-description {
		margin: 0;
		padding: 0.8rem 1.5rem 1.2rem;
		color: var(--ink-muted);
		font-size: 0.8rem;
		line-height: 1.65;
	}

	.description-disclosure {
		border-top: 1px solid var(--line);
	}

	.description-disclosure summary {
		padding: 0.9rem 1.5rem;
		color: var(--green);
		font-size: 0.78rem;
		font-weight: 720;
		cursor: pointer;
	}

	.award-dimensions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		border-block: 1px solid var(--line);
		background: #f7f9fc;
	}

	.award-dimensions > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.3rem 1rem;
		padding: 0.85rem 1rem;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}

	.award-dimensions > div:nth-child(even) {
		border-right: 0;
	}

	.award-dimensions span,
	.award-dimensions strong {
		font-size: 0.76rem;
	}

	.award-dimensions span {
		color: var(--ink-muted);
	}

	.award-dimensions strong {
		color: var(--green);
	}

	.award-dimensions p {
		grid-column: 1 / -1;
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.73rem;
		line-height: 1.45;
	}

	.award-context {
		padding-top: 1rem;
		padding-bottom: 0;
	}

	.outputs,
	.provenance {
		padding: 1.2rem 1.5rem;
	}

	.outputs {
		border-top: 1px solid var(--line);
	}

	.outputs h4,
	.provenance h4 {
		margin: 0 0 0.7rem;
		color: var(--ink-strong);
		font-size: 0.78rem;
		font-weight: 760;
	}

	.outputs ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.outputs a,
	.source-links a,
	.external-funder-link {
		color: var(--green);
		font-size: 0.75rem;
		font-weight: 720;
		text-underline-offset: 0.2rem;
	}

	.provenance {
		border-top: 1px solid var(--line);
		background: color-mix(in srgb, var(--surface-muted) 35%, transparent);
	}

	.source-list {
		display: grid;
		gap: 0.55rem;
	}

	.source-record {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 0.55rem;
		border-top: 1px solid var(--line);
	}

	.source-record > div:first-child {
		display: grid;
		gap: 0.15rem;
	}

	.source-record strong {
		color: var(--ink-strong);
		font-size: 0.72rem;
	}

	.source-record span {
		color: var(--ink-muted);
		font-size: 0.64rem;
	}

	.source-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		align-items: start;
	}

	.context-column {
		position: sticky;
		top: 1.5rem;
	}

	.aside-panel {
		padding: 1.2rem;
	}

	.aside-panel h2 {
		margin: 0 0 0.8rem;
		color: var(--ink-strong);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.1rem;
		font-weight: 500;
	}

	.aside-panel h3 {
		margin: 1rem 0 0.5rem;
		color: var(--ink-muted);
		font-size: 0.74rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.funding-list,
	.plain-list {
		display: grid;
		gap: 0.7rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.funding-list li {
		display: grid;
		gap: 0.2rem;
		padding-bottom: 0.7rem;
		border-bottom: 1px solid var(--line);
	}

	.funding-list strong {
		color: var(--ink-strong);
		font-size: 0.83rem;
	}

	.funding-list span,
	.plain-list,
	.aside-note,
	.limitation-panel p {
		color: var(--ink-muted);
		font-size: 0.76rem;
		line-height: 1.55;
	}

	.plain-list li + li {
		padding-top: 0.65rem;
		border-top: 1px solid var(--line);
	}

	.aside-note {
		margin: 0.8rem 0 0;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.limitation-panel {
		background: var(--green-dark);
	}

	.limitation-panel h2 {
		color: white;
	}

	.limitation-panel p {
		color: rgba(255, 255, 255, 0.72);
	}

	.limitation-panel p:last-child {
		margin-bottom: 0;
	}

	.external-funder-link {
		padding-inline: 0.3rem;
	}

	.state-card {
		max-width: 50rem;
		margin: 3rem auto;
		padding: 3rem;
		text-align: center;
	}

	.state-card h1 {
		max-width: 18ch;
		margin-inline: auto;
		font-size: clamp(2rem, 4vw, 3.2rem);
	}

	.state-card > p:not(.eyebrow) {
		color: var(--ink-muted);
	}

	.action-link {
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

	.loading-title,
	.loading-line,
	.loading-panels i {
		border-radius: 0.5rem;
		background: linear-gradient(90deg, #e4e2da, #f5f3ec, #e4e2da);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.loading-title {
		width: 70%;
		height: 3rem;
		margin: 0 auto 1rem;
	}

	.loading-line {
		width: 45%;
		height: 0.8rem;
		margin: 0 auto 2rem;
	}

	.loading-panels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.loading-panels i {
		height: 5rem;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	@media (max-width: 900px) {
		.detail-layout {
			grid-template-columns: 1fr;
		}

		.context-column {
			position: static;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.detail-heading {
			grid-template-columns: 1fr;
		}

		.total-score {
			width: fit-content;
		}

		.summary-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.summary-grid div:nth-child(2) {
			border-right: 0;
		}

		.summary-grid div:nth-child(-n + 2) {
			border-bottom: 1px solid var(--line);
		}

		.why-panel,
		.context-column {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.section-heading,
		.award-card > header,
		.source-record {
			align-items: start;
			flex-direction: column;
		}

		.section-heading > p {
			text-align: left;
		}

		.dimension-row {
			grid-template-columns: 7rem 1fr 1.8rem;
		}

		.award-dimensions {
			grid-template-columns: 1fr;
		}

		.award-dimensions > div {
			border-right: 0;
		}

		.state-card {
			padding: 2rem 1rem;
		}
	}
</style>
