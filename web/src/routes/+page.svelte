<script lang="ts">
	import SearchForm from '$lib/components/search-form.svelte';
</script>

<svelte:head>
	<title>Who Funds This? — Find funders behind research like yours</title>
	<meta
		name="description"
		content="Find organizations that have funded research like yours, with matching awards, amounts, institutions, and source evidence."
	/>
</svelte:head>

<section class="hero">
	<div class="site-shell hero-grid">
		<div class="hero-copy">
			<p class="eyebrow">Historical funding, made useful</p>
			<h1>Find the funders behind research like yours.</h1>
			<p class="hero-intro">
				Describe an idea. We search millions of historical awards, rank the strongest matches, and
				show the evidence behind every funder.
			</p>
			<div class="evidence-points" aria-label="Product principles">
				<span><i></i> Explainable scores</span>
				<span><i></i> Source-linked awards</span>
				<span><i></i> No account required</span>
			</div>
		</div>

		<div class="search-panel">
			<div class="panel-heading">
				<span>Start a search</span>
				<small>Free</small>
			</div>
			<SearchForm />
		</div>
	</div>
</section>

<section class="proof-strip">
	<div class="site-shell proof-grid">
		<div>
			<strong>17M+</strong>
			<span>awards indexed by OpenAlex</span>
		</div>
		<div>
			<strong>5 signals</strong>
			<span>behind each transparent score</span>
		</div>
		<div>
			<strong>Source first</strong>
			<span>every recommendation links to evidence</span>
		</div>
	</div>
</section>

<section class="explainer site-shell" id="how-it-works">
	<div class="section-heading">
		<p class="eyebrow">How it works</p>
		<h2>From a research idea to credible funder evidence.</h2>
	</div>
	<div class="steps">
		<article>
			<span>01</span>
			<h3>Search historical awards</h3>
			<p>
				We use your non-confidential description to retrieve a focused candidate set from OpenAlex.
			</p>
		</article>
		<article>
			<span>02</span>
			<h3>Score what matters</h3>
			<p>
				Text, topics, geography, recency, and metadata quality remain visible as separate signals.
			</p>
		</article>
		<article>
			<span>03</span>
			<h3>Follow the evidence</h3>
			<p>
				Explore the awards, institutions, investigators, amounts, publications, and original
				sources.
			</p>
		</article>
	</div>
</section>

<section class="methodology" id="methodology">
	<div class="site-shell methodology-inner">
		<div>
			<p class="eyebrow">Built for honest interpretation</p>
			<h2>A match is a lead, not a promise.</h2>
		</div>
		<div class="methodology-copy">
			<p>
				Historical funding can reveal patterns, but it cannot prove present-day eligibility. Missing
				data stays visible, geography is never a hard exclusion, and amounts are kept in their
				original currencies.
			</p>
			<a href="https://help.openalex.org/data/awards/" rel="noreferrer"
				>Read about OpenAlex award data →</a
			>
		</div>
	</div>
</section>

<style>
	.hero {
		padding: 5.5rem 0 4.5rem;
	}

	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 0.88fr) minmax(32rem, 1.12fr);
		align-items: center;
		gap: clamp(3rem, 7vw, 7rem);
	}

	.eyebrow {
		margin: 0 0 1rem;
		color: var(--green);
		font-size: 0.73rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1 {
		max-width: 10ch;
		margin-bottom: 1.45rem;
		color: var(--ink-strong);
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(3.25rem, 6vw, 5.7rem);
		font-weight: 500;
		letter-spacing: -0.055em;
		line-height: 0.97;
	}

	.hero-intro {
		max-width: 35rem;
		margin-bottom: 1.6rem;
		color: #59645e;
		font-size: 1.05rem;
		line-height: 1.7;
	}

	.evidence-points {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem 1.1rem;
		color: var(--ink-muted);
		font-size: 0.78rem;
		font-weight: 620;
	}

	.evidence-points span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.evidence-points i {
		width: 0.38rem;
		height: 0.38rem;
		border-radius: 50%;
		background: var(--gold);
	}

	.search-panel {
		border: 1px solid color-mix(in srgb, var(--line-strong) 85%, white);
		border-radius: 1.2rem;
		padding: 1.3rem;
		background: color-mix(in srgb, var(--surface) 95%, transparent);
		box-shadow: var(--shadow);
	}

	.panel-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.15rem;
		padding-bottom: 0.85rem;
		border-bottom: 1px solid var(--line);
		color: var(--ink-strong);
		font-size: 0.85rem;
		font-weight: 750;
	}

	.panel-heading small {
		border-radius: 999px;
		padding: 0.28rem 0.58rem;
		background: var(--green-soft);
		color: var(--green-dark);
		font-size: 0.68rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.proof-strip {
		border-block: 1px solid var(--line);
		background: color-mix(in srgb, var(--surface-muted) 58%, transparent);
	}

	.proof-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}

	.proof-grid > div {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		padding: 1.35rem 1.5rem;
		border-right: 1px solid var(--line);
	}

	.proof-grid > div:first-child {
		padding-left: 0;
	}

	.proof-grid > div:last-child {
		border-right: 0;
	}

	.proof-grid strong {
		color: var(--ink-strong);
		font-family: Georgia, serif;
		font-size: 1.2rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.proof-grid span {
		color: var(--ink-muted);
		font-size: 0.76rem;
	}

	.explainer {
		padding-block: 6rem;
	}

	.section-heading {
		display: grid;
		grid-template-columns: 1fr 2fr;
		align-items: start;
		margin-bottom: 3rem;
	}

	.section-heading h2,
	.methodology h2 {
		max-width: 18ch;
		margin-bottom: 0;
		color: var(--ink-strong);
		font-family: Georgia, serif;
		font-size: clamp(2.2rem, 4vw, 3.6rem);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 1.05;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid var(--line-strong);
	}

	.steps article {
		padding: 1.5rem 2.5rem 0 0;
	}

	.steps article + article {
		padding-left: 2.5rem;
		border-left: 1px solid var(--line);
	}

	.steps span {
		display: block;
		margin-bottom: 2.5rem;
		color: var(--gold);
		font-family: Georgia, serif;
		font-size: 0.88rem;
	}

	.steps h3 {
		margin-bottom: 0.65rem;
		color: var(--ink-strong);
		font-size: 1rem;
	}

	.steps p {
		margin-bottom: 0;
		color: var(--ink-muted);
		font-size: 0.88rem;
		line-height: 1.65;
	}

	.methodology {
		padding: 5rem 0;
		background: var(--ink-strong);
		color: #e4ebe7;
	}

	.methodology-inner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5rem;
		align-items: end;
	}

	.methodology .eyebrow {
		color: #9dc5b2;
	}

	.methodology h2 {
		color: white;
	}

	.methodology-copy p {
		margin-bottom: 1.2rem;
		color: #bac5bf;
		line-height: 1.75;
	}

	.methodology-copy a {
		color: #f1d999;
		font-size: 0.86rem;
		font-weight: 700;
		text-underline-offset: 0.25rem;
	}

	@media (max-width: 900px) {
		.hero {
			padding-top: 3.5rem;
		}

		.hero-grid {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}

		h1 {
			max-width: 12ch;
		}

		.proof-grid,
		.steps,
		.methodology-inner {
			grid-template-columns: 1fr;
		}

		.proof-grid > div {
			padding-left: 0;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.proof-grid > div:last-child {
			border-bottom: 0;
		}

		.section-heading {
			grid-template-columns: 1fr;
		}

		.steps article,
		.steps article + article {
			padding: 1.5rem 0;
			border-left: 0;
			border-bottom: 1px solid var(--line);
		}

		.steps span {
			margin-bottom: 1rem;
		}

		.methodology-inner {
			gap: 2rem;
		}
	}
</style>
