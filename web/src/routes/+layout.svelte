<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import '../styles.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Who Funds This?" />
	<meta property="og:title" content="Who Funds This? — Find funders behind research like yours" />
	<meta
		property="og:description"
		content="Find organizations that funded research like yours and inspect the award evidence behind every match."
	/>
	<meta property="og:image" content={asset('/og-image.png')} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Who Funds This? Historical funding evidence for your research"
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={asset('/og-image.png')} />
</svelte:head>

<header class="site-header">
	<div class="site-shell site-header-inner">
		<a class="brand" href={resolve('/')} aria-label="Who Funds This? home">
			<img class="brand-mark" src={favicon} alt="" />
			<span>Who Funds This?</span>
		</a>
		<nav class="site-nav" aria-label="Main navigation">
			<a href={resolve('/#how-it-works')}>How it works</a>
			<a href={resolve('/#methodology')}>Methodology</a>
		</nav>
	</div>
</header>

<main>{@render children()}</main>

<footer class="site-footer">
	<div class="site-shell site-footer-inner">
		<p>Historical funding evidence for better research conversations.</p>
		<p>
			Award data from <a href="https://openalex.org" rel="noreferrer">OpenAlex</a>. A match is not a
			statement of eligibility.
		</p>
	</div>
</footer>
