<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { untrack } from 'svelte';

	let {
		id,
		options,
		value = $bindable(''),
		open = $bindable(false),
		onopen
	}: {
		id: string;
		options: string[];
		value?: string;
		open?: boolean;
		onopen?: () => void;
	} = $props();

	const items = untrack(() => options.map((option) => ({ value: option, label: option })));
	let searchValue = $state(untrack(() => value));
	let inputElement = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open) onopen?.();
	});

	const filteredOptions = $derived.by(() => {
		const query = searchValue.trim().toLowerCase();
		if (!query || value === searchValue) return options;

		return options.filter((option) => option.toLowerCase().includes(query));
	});

	const getValue = () => value;

	const setValue = (nextValue: string) => {
		value = nextValue;
		searchValue = nextValue;
		inputElement?.setCustomValidity('');
	};

	const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		const input = event.currentTarget;
		const option = options.find(
			(candidate) => candidate.toLowerCase() === input.value.trim().toLowerCase()
		);

		searchValue = input.value;
		value = option ?? '';
		input.setCustomValidity(
			input.value.trim() && !option ? 'Choose a broad field from the suggestions.' : ''
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
	<div class="field-control">
		<Combobox.Input
			{id}
			bind:ref={inputElement}
			placeholder="Any field"
			autocomplete="off"
			onfocus={() => (open = true)}
			onclick={() => (open = true)}
			oninput={handleInput}
		/>
		<Combobox.Trigger aria-label="Toggle broad field list">
			<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"></path></svg>
		</Combobox.Trigger>
	</div>
	<Combobox.Portal>
		<Combobox.Content class="field-options" sideOffset={4} collisionPadding={12}>
			<Combobox.Viewport class="field-viewport">
				{#each filteredOptions as option (option)}
					<Combobox.Item value={option} label={option} class="field-option">
						{#snippet children({ selected })}
							<span>{option}</span>
							{#if selected}<strong aria-hidden="true">✓</strong>{/if}
						{/snippet}
					</Combobox.Item>
				{:else}
					<p class="field-empty">No matching field</p>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
<input type="hidden" name="field" {value} />

<style>
	.field-control {
		position: relative;
	}

	.field-control :global(input) {
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

	.field-control :global(input:focus) {
		border-color: var(--green);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 13%, transparent);
	}

	.field-control :global(button) {
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

	.field-control svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}

	:global(.field-options) {
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

	:global(.field-viewport) {
		max-height: min(20rem, var(--bits-combobox-content-available-height));
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	:global(.field-option) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.7rem;
		align-items: center;
		min-height: 2.5rem;
		border-radius: 0.2rem;
		padding: 0.5rem 0.65rem;
		color: var(--ink);
		font-size: 0.86rem;
		line-height: 1.25;
		outline: none;
		cursor: pointer;
	}

	:global(.field-option[data-highlighted]) {
		background: var(--green-soft);
		color: var(--green-dark);
	}

	:global(.field-option > span) {
		font-weight: 650;
	}

	:global(.field-option strong) {
		color: var(--green);
	}

	:global(.field-empty) {
		margin: 0;
		padding: 0.75rem;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
</style>
