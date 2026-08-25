<script lang="ts">
	import CountryCombobox from '$lib/components/country-combobox.svelte';
	import FieldCombobox from '$lib/components/field-combobox.svelte';
	import openAlexFields from '$lib/data/openalex-fields.json';
	import { startFundingSearch } from '$lib/remote-functions/funding-search.remote';

	let {
		description = '',
		countryCode = '',
		field = '',
		compact = false
	}: {
		description?: string;
		countryCode?: string;
		field?: string;
		compact?: boolean;
	} = $props();

	const fields = openAlexFields.fields.map(({ displayName }) => displayName);
	const examples = [
		{
			description: 'A malaria vaccine that protects pregnant women in West Africa',
			context: 'Description only',
			countryCode: '',
			field: ''
		},
		{
			description: 'Community health workers improving maternal care in rural Benin',
			context: 'Benin · Medicine',
			countryCode: 'BJ',
			field: 'Medicine'
		},
		{
			description: 'Machine-learning tools to predict crop yields under climate stress',
			context: 'Agricultural and Biological Sciences',
			countryCode: '',
			field: 'Agricultural and Biological Sciences'
		}
	];

	let countryOpen = $state(false);
	let fieldOpen = $state(false);
	let textareaElement = $state<HTMLTextAreaElement | null>(null);
	let loadedExample = $state('');
	let optionsVersion = $state(0);

	const loadExample = (example: (typeof examples)[number]) => {
		description = example.description;
		countryCode = example.countryCode;
		field = example.field;
		countryOpen = false;
		fieldOpen = false;
		optionsVersion += 1;
		loadedExample = `Example loaded: ${example.description}`;
		textareaElement?.focus();
	};
</script>

<form {...startFundingSearch} class:compact class="search-form">
	<div class="description-field">
		<label for={compact ? 'research-description-compact' : 'research-description'}>
			Research description
		</label>
		<textarea
			id={compact ? 'research-description-compact' : 'research-description'}
			bind:this={textareaElement}
			bind:value={description}
			name="description"
			rows={compact ? 2 : 4}
			maxlength="1000"
			required
			placeholder="e.g. A malaria vaccine that protects pregnant women in West Africa"></textarea>
		{#each startFundingSearch.fields.description.issues() ?? [] as issue (issue.message)}
			<p class="field-error">{issue.message}</p>
		{/each}
	</div>

	{#if !compact}
		<div class="examples" aria-labelledby="example-heading">
			<div class="examples-heading">
				<strong id="example-heading">Try an example</strong>
				<span>Click to fill the form</span>
			</div>
			<div class="example-list">
				{#each examples as example (example.description)}
					<button
						type="button"
						class="example"
						onclick={() => loadExample(example)}
						aria-label={`Fill the form with: ${example.description}. ${example.context}`}
					>
						<span>{example.description}</span>
						<small>{example.context}</small>
						<svg viewBox="0 0 20 20" aria-hidden="true">
							<path d="M5 10h10m-4-4 4 4-4 4"></path>
						</svg>
					</button>
				{/each}
			</div>
			<p class="visually-hidden" aria-live="polite">{loadedExample}</p>
		</div>
	{/if}

	<div class="search-options">
		<div class="country-combobox">
			<label for={compact ? 'country-compact' : 'country'}>
				<span class="label-title">Applicant country</span>
				<span class="label-note">Optional</span>
			</label>
			{#key optionsVersion}
				<CountryCombobox
					id={compact ? 'country-compact' : 'country'}
					bind:value={countryCode}
					bind:open={countryOpen}
					onopen={() => (fieldOpen = false)}
				/>
			{/key}
			{#each startFundingSearch.fields.countryCode.issues() ?? [] as issue (issue.message)}
				<p class="field-error">{issue.message}</p>
			{/each}
		</div>

		<div class="field-combobox">
			<label for={compact ? 'field-compact' : 'field'}>
				<span class="label-title">Broad field</span>
				<span class="label-note">Optional</span>
			</label>
			{#key optionsVersion}
				<FieldCombobox
					id={compact ? 'field-compact' : 'field'}
					options={fields}
					bind:value={field}
					bind:open={fieldOpen}
					onopen={() => (countryOpen = false)}
				/>
			{/key}
		</div>

		<button class="submit-button" type="submit" disabled={startFundingSearch.pending > 0}>
			{startFundingSearch.pending > 0
				? 'Searching…'
				: compact
					? 'Search again'
					: 'Find matching funders'}
		</button>
	</div>

	{#if !compact}
		<p class="privacy-note">
			Use a short, non-confidential summary. Your description is sent to OpenAlex to find historical
			awards.
		</p>
	{/if}
</form>

<style>
	.search-form {
		display: grid;
		gap: 1.15rem;
	}

	label {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.48rem;
		color: var(--ink-strong);
		font-size: 0.8rem;
		font-weight: 720;
		letter-spacing: 0.045em;
		text-transform: uppercase;
	}

	.label-note {
		color: var(--ink-muted);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.03em;
	}

	.search-options label {
		display: grid;
		min-height: 2.35rem;
		align-content: start;
		justify-content: start;
		gap: 0.12rem;
	}

	.examples {
		border-top: 1px solid var(--line);
	}

	.examples-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0 0.55rem;
	}

	.examples-heading strong {
		color: var(--ink-strong);
		font-size: 0.78rem;
		font-weight: 720;
		letter-spacing: 0.045em;
		text-transform: uppercase;
	}

	.examples-heading span {
		color: var(--ink-muted);
		font-size: 0.75rem;
	}

	.example-list {
		border-block: 1px solid var(--line);
	}

	.example {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto 1rem;
		gap: 0.75rem;
		align-items: center;
		width: 100%;
		border: 0;
		padding: 0.55rem 0.15rem;
		background: transparent;
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease;
	}

	.example + .example {
		border-top: 1px solid var(--line);
	}

	.example:hover,
	.example:focus-visible {
		background: color-mix(in srgb, var(--green-soft) 48%, transparent);
		color: var(--green-dark);
		outline: none;
	}

	.example:focus-visible {
		box-shadow: inset 3px 0 0 var(--green);
	}

	.example > span {
		overflow: hidden;
		font-size: 0.82rem;
		font-weight: 620;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.example small {
		color: var(--ink-muted);
		font-size: 0.72rem;
		white-space: nowrap;
	}

	.example svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: var(--green);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.6;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.label-title {
		white-space: nowrap;
	}

	textarea {
		width: 100%;
		border: 1px solid var(--line-strong);
		border-radius: 0.35rem;
		background: var(--surface);
		color: var(--ink-strong);
		font: inherit;
		outline: none;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease;
	}

	textarea {
		min-height: 8.5rem;
		padding: 1rem 1.05rem;
		font-size: 1rem;
		line-height: 1.55;
		resize: vertical;
	}

	.country-combobox :global(input),
	.field-combobox :global(input) {
		height: 3rem;
		padding: 0 0.85rem;
	}

	textarea:focus {
		border-color: var(--green);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 13%, transparent);
	}

	.search-options {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) auto;
		align-items: end;
		gap: 0.8rem;
	}

	.submit-button {
		height: 3rem;
		border: 0;
		border-radius: 0.35rem;
		padding: 0 1.25rem;
		background: var(--green);
		color: white;
		font: inherit;
		font-size: 0.88rem;
		font-weight: 750;
		white-space: nowrap;
		cursor: pointer;
		box-shadow: none;
		transition:
			background 140ms ease,
			color 140ms ease;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--green-dark);
		color: white;
	}

	.submit-button:disabled {
		opacity: 0.62;
		cursor: wait;
	}

	.privacy-note {
		margin: -0.15rem 0 0;
		color: var(--ink-muted);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	.field-error {
		margin: 0.35rem 0 0;
		color: #a63c2e;
		font-size: 0.78rem;
	}

	.compact textarea {
		min-height: 4.6rem;
	}

	@media (max-width: 760px) {
		.search-options {
			grid-template-columns: 1fr;
		}

		.submit-button {
			width: 100%;
		}

		.example {
			grid-template-columns: minmax(0, 1fr) 1rem;
			padding-block: 0.65rem;
		}

		.example > span {
			overflow: visible;
			white-space: normal;
		}

		.example small {
			grid-column: 1;
			grid-row: 2;
		}

		.example svg {
			grid-column: 2;
			grid-row: 1 / 3;
		}
	}
</style>
