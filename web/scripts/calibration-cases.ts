type RelevanceGrade = 0 | 1 | 2 | 3;

type CalibrationCase = {
	id: string;
	description: string;
	countryCode: string;
	field: string;
	judgments: Record<string, RelevanceGrade>;
};

const CALIBRATION_CASES: CalibrationCase[] = [
	{
		id: 'pregnancy-malaria-vaccine',
		description: 'pregnancy malaria vaccine',
		countryCode: 'BJ',
		field: 'Medicine',
		judgments: {
			F4320320300: 3,
			F4320332161: 3,
			F4320334506: 3,
			F4320338440: 3,
			F4320320997: 2,
			F4320338337: 2,
			F4320311904: 2,
			F4320334626: 1,
			F4320338335: 1,
			F4320334764: 2
		}
	},
	{
		id: 'climate-resilient-maize-farming',
		description: 'climate resilient maize farming',
		countryCode: 'NG',
		field: 'Agricultural and Biological Sciences',
		judgments: {
			F4320320883: 1,
			F4320323478: 2,
			F4320306137: 3,
			F4320320924: 0,
			F4320306115: 1,
			F4320321001: 0,
			F4320335777: 0,
			F4320329182: 2,
			F4320335787: 0,
			F4320332299: 2
		}
	},
	{
		id: 'maternal-health-digital-interventions',
		description: 'maternal health digital interventions',
		countryCode: 'GH',
		field: 'Medicine',
		judgments: {
			F4320332161: 3,
			F4320334506: 2,
			F4320319990: 3,
			F4320306230: 2,
			F4320334627: 3,
			F4320338440: 3,
			F4320311904: 0,
			F4320320300: 3,
			F4320323299: 1,
			F4320334626: 0
		}
	},
	{
		id: 'coastal-erosion-climate-adaptation',
		description: 'coastal erosion climate adaptation',
		countryCode: 'BJ',
		field: 'Environmental Science',
		judgments: {
			F4320334631: 3,
			F4320334630: 3,
			F4320335087: 2,
			F4320338348: 3,
			F4320321800: 3,
			F4320334779: 3,
			F4320320300: 3,
			F4320338438: 2,
			F4320338445: 3,
			F4320321033: 3
		}
	},
	{
		id: 'machine-learning-crop-disease',
		description: 'machine learning crop disease',
		countryCode: 'KE',
		field: 'Computer Science',
		judgments: {
			F4320334779: 3,
			F4320334629: 3,
			F4320335087: 3,
			F4320334627: 3,
			F4320306076: 3,
			F4320334436: 2,
			F4320322795: 1,
			F4320323299: 2,
			F4320334704: 1,
			F4320327336: 0
		}
	}
];

export { CALIBRATION_CASES, type CalibrationCase, type RelevanceGrade };
