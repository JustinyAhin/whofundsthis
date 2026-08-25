import type { CalibrationCase, RelevanceGrade } from './calibration-cases';

type ObservedRankingResult = {
	awardCount: number;
	funderIds: string[];
	funderScores: number[];
};

type VerboseTitleFailure = {
	awardId: string;
	funderId: string;
	expectedGrade: RelevanceGrade;
	matchedTerms: string[];
	observedAwardScore: number;
	observedFunderScore: number;
	normalizedFunderScore: number;
	observedTitleLength: number;
	titlePrefix: string;
};

type RankingRegressionCase = CalibrationCase & {
	evidenceSource: string;
	observedKeyword: ObservedRankingResult;
	observedCombined: ObservedRankingResult;
	verboseTitleFailure: VerboseTitleFailure;
};

const RANKING_REGRESSION_CASES: RankingRegressionCase[] = [
	{
		id: 'community-maternal-care-rural-benin',
		description: 'Community health workers improving maternal care in rural Benin',
		countryCode: 'BJ',
		field: 'Medicine',
		judgments: {
			F4320332162: 0,
			F4320334626: 3,
			F4320319949: 3,
			F4320334506: 2,
			F4320333677: 2,
			F4320323299: 1,
			F4320327239: 1,
			F4320319994: 0,
			F4320320300: 2,
			F4320306137: 1
		},
		evidenceSource: 'Production result inspected through Chrome on 2026-08-25',
		observedKeyword: {
			awardCount: 14,
			funderIds: [
				'F4320332162',
				'F4320334626',
				'F4320319949',
				'F4320334506',
				'F4320333677',
				'F4320323299',
				'F4320327239',
				'F4320319994'
			],
			funderScores: [77, 61, 60, 55, 52, 51, 51, 48]
		},
		observedCombined: {
			awardCount: 26,
			funderIds: [
				'F4320319949',
				'F4320334626',
				'F4320332162',
				'F4320334506',
				'F4320320300',
				'F4320333677',
				'F4320323299',
				'F4320327239',
				'F4320319994',
				'F4320306137'
			],
			funderScores: [76, 76, 72, 70, 69, 68, 66, 66, 63, 54]
		},
		verboseTitleFailure: {
			awardId: 'G692383321',
			funderId: 'F4320332162',
			expectedGrade: 0,
			matchedTerms: ['community', 'health', 'workers', 'maternal', 'care', 'rural'],
			observedAwardScore: 71,
			observedFunderScore: 77,
			normalizedFunderScore: 72,
			observedTitleLength: 3997,
			titlePrefix:
				'NATIONAL INITIATIVE TO ADDRESS COVID-19 HEALTH DISPARITIES AMONG POPULATIONS AT HIGH-RISK AND UNDERSERVED, INCLUDING RACIAL AND ETHNIC MINORITY POPULATIONS AND RURAL COMMUNITIES'
		}
	}
];

export {
	RANKING_REGRESSION_CASES,
	type ObservedRankingResult,
	type RankingRegressionCase,
	type VerboseTitleFailure
};
