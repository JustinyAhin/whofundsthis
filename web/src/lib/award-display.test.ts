import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { getAwardDisplay, MAX_AWARD_TITLE_LENGTH } from './award-display';

const baseAward = {
	title: 'Community health workers improving maternal care',
	description: 'This project evaluates community health worker support for rural clinics.',
	scheme: null,
	funderAwardId: null
};

describe('getAwardDisplay', () => {
	test('preserves a normal title and distinct description', () => {
		assert.deepEqual(getAwardDisplay(baseAward), {
			title: baseAward.title,
			description: baseAward.description
		});
	});

	test('suppresses a description that duplicates the title', () => {
		assert.deepEqual(
			getAwardDisplay({
				...baseAward,
				description: ' Community health workers—improving maternal care. '
			}),
			{
				title: baseAward.title,
				description: null
			}
		);
	});

	test('moves a narrative title into the description and uses the scheme as the heading', () => {
		const narrative = 'A'.repeat(MAX_AWARD_TITLE_LENGTH + 1);

		assert.deepEqual(
			getAwardDisplay({
				title: narrative,
				description: narrative,
				scheme: 'Public Health Crisis Response',
				funderAwardId: 'CDC-123'
			}),
			{
				title: 'Public Health Crisis Response',
				description: narrative
			}
		);
	});

	test('uses an award reference when a narrative title has no concise scheme', () => {
		assert.equal(
			getAwardDisplay({
				...baseAward,
				title: 'A'.repeat(MAX_AWARD_TITLE_LENGTH + 1),
				scheme: 'S'.repeat(161),
				funderAwardId: 'NSF-456'
			}).title,
			'Award NSF-456'
		);
	});

	test('uses a neutral record heading when only narrative text is available', () => {
		const narrative = 'A'.repeat(MAX_AWARD_TITLE_LENGTH + 1);

		assert.deepEqual(
			getAwardDisplay({
				title: narrative,
				description: null,
				scheme: null,
				funderAwardId: null
			}),
			{ title: 'Award record', description: narrative }
		);
	});
});
