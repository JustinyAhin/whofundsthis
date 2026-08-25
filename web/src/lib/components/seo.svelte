<script lang="ts">
	import { page } from '$app/state';
	import { SITE } from '$lib/site';

	type StructuredData = Record<string, unknown>;

	type Props = {
		title?: string;
		description?: string;
		keywords?: string;
		canonical?: string;
		ogImage?: string;
		ogImageAlt?: string;
		ogType?: string;
		robots?: string;
		structuredData?: StructuredData | StructuredData[];
	};

	let {
		title = SITE.defaultTitle,
		description = SITE.defaultDescription,
		keywords,
		canonical,
		ogImage = SITE.defaultOgImage,
		ogImageAlt = SITE.defaultOgImageAlt,
		ogType = 'website',
		robots = 'index,follow',
		structuredData
	}: Props = $props();

	const absoluteUrl = (pathOrUrl: string) => new URL(pathOrUrl, page.url.origin).href;
	const canonicalUrl = $derived(absoluteUrl(canonical ?? page.url.pathname));
	const ogImageUrl = $derived(absoluteUrl(ogImage));
	const structuredDataItems = $derived(
		structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : []
	);
	const jsonLd = (data: StructuredData) =>
		JSON.stringify(data).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	<meta name="robots" content={robots} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={ogImageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={ogImageAlt} />

	{#each structuredDataItems as data, index (index)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON is escaped before insertion into a script element. -->
		{@html `<script type="application/ld+json">${jsonLd(data)}<` + '/script>'}
	{/each}
</svelte:head>
