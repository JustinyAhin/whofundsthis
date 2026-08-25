<script lang="ts">
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

	const countries = [
		['BJ', 'Benin'],
		['NG', 'Nigeria'],
		['GH', 'Ghana'],
		['KE', 'Kenya'],
		['ZA', 'South Africa'],
		['TZ', 'Tanzania'],
		['UG', 'Uganda'],
		['RW', 'Rwanda'],
		['SN', 'Senegal'],
		['CI', "Côte d'Ivoire"],
		['CM', 'Cameroon'],
		['ET', 'Ethiopia'],
		['IN', 'India'],
		['BR', 'Brazil'],
		['GB', 'United Kingdom'],
		['US', 'United States'],
		['CA', 'Canada'],
		['FR', 'France'],
		['DE', 'Germany']
	];

	const fields = [
		'Medicine',
		'Agricultural and Biological Sciences',
		'Environmental Science',
		'Computer Science',
		'Social Sciences',
		'Engineering',
		'Earth and Planetary Sciences',
		'Biochemistry, Genetics and Molecular Biology',
		'Immunology and Microbiology',
		'Economics, Econometrics and Finance'
	];
</script>

<form {...startFundingSearch} class:compact class="search-form">
	<div class="description-field">
		<label for={compact ? 'research-description-compact' : 'research-description'}>
			Research description
		</label>
		<textarea
			id={compact ? 'research-description-compact' : 'research-description'}
			name="description"
			rows={compact ? 2 : 4}
			maxlength="1000"
			required
			placeholder="e.g. A malaria vaccine that protects pregnant women in West Africa"
			>{description}</textarea
		>
		{#each startFundingSearch.fields.description.issues() ?? [] as issue (issue.message)}
			<p class="field-error">{issue.message}</p>
		{/each}
	</div>

	<div class="search-options">
		<div>
			<label for={compact ? 'country-compact' : 'country'}
				>Applicant country <span>Optional</span></label
			>
			<select id={compact ? 'country-compact' : 'country'} name="countryCode" value={countryCode}>
				<option value="">Any country</option>
				{#each countries as country (country[0])}
					<option value={country[0]}>{country[1]}</option>
				{/each}
			</select>
			{#each startFundingSearch.fields.countryCode.issues() ?? [] as issue (issue.message)}
				<p class="field-error">{issue.message}</p>
			{/each}
		</div>

		<div>
			<label for={compact ? 'field-compact' : 'field'}>Broad field <span>Optional</span></label>
			<select id={compact ? 'field-compact' : 'field'} name="field" value={field}>
				<option value="">Any field</option>
				{#each fields as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>

		<button type="submit" disabled={startFundingSearch.pending > 0}>
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
		font-size: 0.78rem;
		font-weight: 720;
		letter-spacing: 0.045em;
		text-transform: uppercase;
	}

	label span {
		color: var(--ink-muted);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.03em;
	}

	textarea,
	select {
		width: 100%;
		border: 1px solid var(--line-strong);
		border-radius: 0.75rem;
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

	select {
		height: 3rem;
		padding: 0 2.3rem 0 0.85rem;
	}

	textarea:focus,
	select:focus {
		border-color: var(--green);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 13%, transparent);
	}

	.search-options {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) auto;
		align-items: end;
		gap: 0.8rem;
	}

	button {
		height: 3rem;
		border: 0;
		border-radius: 0.75rem;
		padding: 0 1.25rem;
		background: var(--green);
		color: white;
		font: inherit;
		font-size: 0.88rem;
		font-weight: 750;
		white-space: nowrap;
		cursor: pointer;
		box-shadow: 0 7px 18px color-mix(in srgb, var(--green) 20%, transparent);
		transition:
			background 140ms ease,
			transform 140ms ease;
	}

	button:hover:not(:disabled) {
		background: var(--green-dark);
		transform: translateY(-1px);
	}

	button:disabled {
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

		button {
			width: 100%;
		}
	}
</style>
