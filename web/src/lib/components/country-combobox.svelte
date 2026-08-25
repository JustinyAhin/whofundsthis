<script lang="ts">
	import { countryOptions, findCountry, getCountryName } from '$lib/country-options';
	import { Combobox } from 'bits-ui';
	import { untrack } from 'svelte';

	let {
		id,
		value = $bindable(''),
		open = $bindable(false),
		onopen
	}: {
		id: string;
		value?: string;
		open?: boolean;
		onopen?: () => void;
	} = $props();

	const items = countryOptions.map((country) => ({ value: country.code, label: country.name }));
	let searchValue = $state(untrack(() => getCountryName(value)));

	$effect(() => {
		if (open) onopen?.();
	});

	const filteredCountries = $derived.by(() => {
		const query = searchValue.trim().toLowerCase();
		if (!query || getCountryName(value) === searchValue) return countryOptions;

		return countryOptions.filter(
			(country) =>
				country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query)
		);
	});

	const getValue = () => value;

	const setValue = (nextValue: string) => {
		value = nextValue;
		searchValue = getCountryName(nextValue);
	};

	const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		const input = event.currentTarget;
		const country = findCountry(input.value);

		searchValue = input.value;
		value = country?.code ?? '';
		input.setCustomValidity(
			input.value.trim() && !country ? 'Choose a country from the suggestions.' : ''
		);
	};
</script>

<Combobox.Root
	type="single"
	{items}
	bind:open
	bind:value={getValue, setValue}
	inputValue={searchValue}
>
	<div class="country-control">
		<Combobox.Input
			{id}
			placeholder="Any country"
			autocomplete="off"
			onfocus={() => (open = true)}
			onclick={() => (open = true)}
			oninput={handleInput}
		/>
		<Combobox.Trigger aria-label="Toggle country list">
			<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"></path></svg>
		</Combobox.Trigger>
	</div>
	<Combobox.Portal>
		<Combobox.Content class="country-options" sideOffset={4} collisionPadding={12}>
			<Combobox.Viewport class="country-viewport">
				{#each filteredCountries as country (country.code)}
					<Combobox.Item value={country.code} label={country.name} class="country-option">
						{#snippet children({ selected })}
							<span>{country.name}</span>
							<small>{country.code}</small>
							{#if selected}<strong aria-hidden="true">✓</strong>{/if}
						{/snippet}
					</Combobox.Item>
				{:else}
					<p class="country-empty">No matching country</p>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
<input type="hidden" name="countryCode" {value} />

<style>
	.country-control {
		position: relative;
	}

	.country-control :global(input) {
		width: 100%;
		height: 3rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.35rem;
		padding: 0 2.7rem 0 0.85rem;
		background: var(--surface);
		color: var(--ink-strong);
		font: inherit;
		outline: none;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease;
	}

	.country-control :global(input:focus) {
		border-color: var(--green);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 13%, transparent);
	}

	.country-control :global(button) {
		position: absolute;
		top: 0;
		right: 0;
		display: grid;
		width: 2.7rem;
		height: 3rem;
		place-items: center;
		border: 0;
		padding: 0;
		background: transparent;
		color: var(--ink-muted);
		cursor: pointer;
	}

	.country-control svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}

	:global(.country-options) {
		z-index: 50;
		width: var(--bits-combobox-anchor-width);
		min-width: 16rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.35rem;
		padding: 0.3rem;
		background: var(--surface);
		box-shadow: 0 14px 35px rgba(17, 27, 45, 0.16);
		outline: none;
	}

	:global(.country-viewport) {
		max-height: min(20rem, var(--bits-combobox-content-available-height));
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	:global(.country-option) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 0.7rem;
		align-items: center;
		min-height: 2.5rem;
		border-radius: 0.2rem;
		padding: 0.5rem 0.65rem;
		color: var(--ink);
		font-size: 0.86rem;
		line-height: 1.2;
		outline: none;
		cursor: pointer;
	}

	:global(.country-option[data-highlighted]) {
		background: var(--green-soft);
		color: var(--green-dark);
	}

	:global(.country-option > span) {
		overflow: hidden;
		font-weight: 650;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.country-option small) {
		color: var(--ink-muted);
		font-size: 0.75rem;
		font-weight: 650;
	}

	:global(.country-option strong) {
		color: var(--green);
		font-size: 0.8rem;
	}

	:global(.country-empty) {
		margin: 0;
		padding: 0.8rem;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
</style>
