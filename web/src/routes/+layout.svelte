<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import '../styles.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
