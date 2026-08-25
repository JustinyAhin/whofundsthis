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
	<div class="site-shell hero-layout">
		<div class="hero-copy">
			<p class="edition">Historical award evidence · OpenAlex</p>
			<h1>See who funded the work before yours.</h1>
			<p class="hero-intro">
				Describe your research. We find organizations that funded similar work and show the awards
				behind every result.
			</p>
			<a href="#how-it-works">How the matching works <span aria-hidden="true">↓</span></a>
		</div>

		<div class="search-workspace">
			<header>
				<strong>Search historical funding</strong>
				<span>No account required</span>
			</header>
			<SearchForm />
		</div>
	</div>
</section>

<section class="result-preview">
	<div class="site-shell preview-layout">
		<header>
			<p>What comes back</p>
			<h2>A shortlist you can inspect, not a black-box recommendation.</h2>
		</header>

		<div class="preview-table" aria-label="Example result structure">
			<div class="preview-head"><span>Funder</span><span>Evidence</span><span>Match</span></div>
			<div class="preview-row featured">
				<div>
					<strong>Relevant organizations</strong><small>Ranked by historical similarity</small>
				</div>
				<div><strong>7 matching awards</strong><small>Amounts, years, institutions</small></div>
				<b>82</b>
			</div>
			<div class="preview-row">
				<div><strong>Why each funder appears</strong><small>Plain-language reasoning</small></div>
				<div>
					<strong>5 visible signals</strong><small>Text, topics, place, time, quality</small>
				</div>
				<b>76</b>
			</div>
			<div class="preview-row">
				<div><strong>Original source records</strong><small>Open the evidence yourself</small></div>
				<div>
					<strong>Linked publications</strong><small>Trace what the funding produced</small>
				</div>
				<b>71</b>
			</div>
		</div>
	</div>
</section>

<section class="process site-shell" id="how-it-works">
	<header class="section-heading">
		<h2>From a research idea to usable evidence.</h2>
		<p>
			Built for researchers and support teams who need a credible starting point for a funding
			conversation.
		</p>
	</header>

	<ol>
		<li>
			<strong>Describe the work</strong>
			<p>Use a short, non-confidential summary and optionally add country and broad field.</p>
		</li>
		<li>
			<strong>Compare past awards</strong>
			<p>We retrieve a focused candidate set and score five dimensions independently.</p>
		</li>
		<li>
			<strong>Inspect the record</strong>
			<p>Review matching awards, institutions, amounts, publications, and original sources.</p>
		</li>
	</ol>
</section>

<section class="methodology" id="methodology">
	<div class="site-shell methodology-layout">
		<h2>Useful evidence needs visible limits.</h2>
		<div>
			<p>
				A match shows historical similarity. It does not establish eligibility or predict future
				funding. Missing countries, amounts, or outputs do not mean no evidence exists.
			</p>
			<p>
				We keep currencies separate, avoid hard geographic exclusions, and link back to the
				underlying record wherever possible.
			</p>
			<a href="https://help.openalex.org/data/awards/" rel="noreferrer">
				Read the OpenAlex award documentation <span aria-hidden="true">↗</span>
			</a>
		</div>
	</div>
</section>

<style>
	.hero {
		padding: clamp(4rem, 7vw, 7rem) 0;
		background: var(--ink-strong);
		color: white;
	}

	.hero-layout {
		display: grid;
		grid-template-columns: minmax(0, 0.82fr) minmax(34rem, 1.18fr);
		gap: clamp(3rem, 8vw, 7.5rem);
		align-items: center;
	}

	.edition {
		margin: 0 0 1.6rem;
		color: #93c5fd;
		font-size: 0.82rem;
		font-weight: 650;
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1,
	h2 {
		font-family: 'Iowan Old Style', Charter, 'Bitstream Charter', Cambria, Georgia, serif;
		font-weight: 500;
		letter-spacing: -0.035em;
	}

	h1 {
		max-width: 10ch;
		margin-bottom: 1.5rem;
		font-size: clamp(3.2rem, 5.8vw, 5.25rem);
		line-height: 0.98;
	}

	.hero-intro {
		max-width: 34rem;
		margin-bottom: 2rem;
		color: #c7d2e1;
		font-size: 1.08rem;
		line-height: 1.7;
	}

	.hero-copy a,
	.methodology a {
		color: white;
		font-size: 0.88rem;
		font-weight: 700;
		text-decoration-color: #6680a4;
		text-underline-offset: 0.3rem;
	}

	.hero-copy a span,
	.methodology a span {
		margin-left: 0.35rem;
		color: #93c5fd;
	}

	.search-workspace {
		border-top: 4px solid var(--green);
		padding: 1.6rem;
		background: white;
		color: var(--ink);
	}

	.search-workspace > header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.4rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--line);
	}

	.search-workspace header strong {
		color: var(--ink-strong);
		font-size: 0.95rem;
	}

	.search-workspace header span {
		color: var(--ink-muted);
		font-size: 0.8rem;
	}

	.result-preview {
		padding: clamp(4.5rem, 8vw, 7rem) 0;
		background: white;
	}

	.preview-layout {
		display: grid;
		grid-template-columns: minmax(18rem, 0.7fr) minmax(0, 1.3fr);
		gap: clamp(3rem, 8vw, 8rem);
		align-items: start;
	}

	.result-preview header p {
		margin-bottom: 1rem;
		color: var(--green);
		font-size: 0.83rem;
		font-weight: 720;
	}

	.result-preview h2,
	.section-heading h2,
	.methodology h2 {
		margin-bottom: 0;
		color: var(--ink-strong);
		font-size: clamp(2.2rem, 4vw, 3.6rem);
		line-height: 1.06;
	}

	.preview-table {
		border-top: 2px solid var(--ink-strong);
	}

	.preview-head,
	.preview-row {
		display: grid;
		grid-template-columns: 1.25fr 1fr 4rem;
		gap: 1rem;
		align-items: center;
		border-bottom: 1px solid var(--line);
		padding: 0.8rem 0;
	}

	.preview-head {
		color: var(--ink-muted);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.preview-row {
		padding-block: 1.25rem;
	}

	.preview-row.featured {
		border-bottom-color: var(--green);
	}

	.preview-row div {
		display: grid;
		gap: 0.25rem;
	}

	.preview-row strong {
		color: var(--ink-strong);
		font-size: 0.92rem;
	}

	.preview-row small {
		color: var(--ink-muted);
		font-size: 0.78rem;
	}

	.preview-row b {
		color: var(--green);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.9rem;
		font-weight: 500;
		text-align: right;
	}

	.process {
		padding-block: clamp(5rem, 9vw, 8rem);
	}

	.section-heading {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.55fr);
		gap: 4rem;
		align-items: end;
		margin-bottom: 4rem;
	}

	.section-heading > p {
		margin-bottom: 0;
		color: var(--ink-muted);
		font-size: 1rem;
		line-height: 1.7;
	}

	.process ol {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin: 0;
		border-top: 2px solid var(--ink-strong);
		padding: 0;
		list-style-position: inside;
	}

	.process li {
		min-height: 10rem;
		padding: 1.5rem 2rem 1.5rem 0;
		color: var(--green);
		font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
		font-size: 1.05rem;
	}

	.process li + li {
		border-left: 1px solid var(--line);
		padding-left: 2rem;
	}

	.process li strong {
		display: block;
		margin: 1.5rem 0 0.6rem;
		color: var(--ink-strong);
		font-family: inherit;
		font-size: 1.4rem;
		font-weight: 600;
	}

	.process li p {
		margin-bottom: 0;
		color: var(--ink-muted);
		font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
		font-size: 0.88rem;
		line-height: 1.65;
	}

	.methodology {
		padding: clamp(4.5rem, 8vw, 7rem) 0;
		background: #0b3f91;
		color: white;
	}

	.methodology-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(3rem, 8vw, 8rem);
	}

	.methodology h2 {
		max-width: 13ch;
		color: white;
	}

	.methodology p {
		max-width: 42rem;
		color: #dbeafe;
		font-size: 0.98rem;
		line-height: 1.75;
	}

	.methodology a {
		display: inline-block;
		margin-top: 0.5rem;
	}

	@media (max-width: 900px) {
		.hero-layout,
		.preview-layout,
		.section-heading,
		.methodology-layout {
			grid-template-columns: 1fr;
		}

		.hero-layout,
		.preview-layout {
			gap: 3rem;
		}

		.hero-copy h1 {
			max-width: 12ch;
		}

		.section-heading {
			gap: 1.5rem;
		}
	}

	@media (max-width: 680px) {
		.hero {
			padding-top: 3.5rem;
		}

		.hero-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		h1 {
			font-size: clamp(2.8rem, 14vw, 4rem);
		}

		.search-workspace {
			padding: 1.1rem;
		}

		.search-workspace header span {
			display: none;
		}

		.preview-head {
			display: none;
		}

		.preview-row {
			grid-template-columns: 1fr auto;
		}

		.preview-row > div:nth-child(2) {
			grid-column: 1;
		}

		.preview-row b {
			grid-row: 1 / 3;
			grid-column: 2;
		}

		.process ol {
			grid-template-columns: 1fr;
		}

		.process li + li {
			border-top: 1px solid var(--line);
			border-left: 0;
			padding-left: 0;
		}
	}
</style>
