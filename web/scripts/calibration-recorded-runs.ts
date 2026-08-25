type RecordedStrategyResult = {
	candidateCount: number;
	costUsd: number;
	topFunderScore: number;
	funderIds: string[];
};

type RecordedCalibrationRun = {
	caseId: string;
	keyword: RecordedStrategyResult;
	combined: RecordedStrategyResult;
};

const RECORDED_CALIBRATION_RUNS: RecordedCalibrationRun[] = [
	{
		caseId: 'pregnancy-malaria-vaccine',
		keyword: {
			candidateCount: 32,
			costUsd: 0.0001,
			topFunderScore: 66,
			funderIds: ['F4320332161', 'F4320334506', 'F4320320300', 'F4320334626', 'F4320338337']
		},
		combined: {
			candidateCount: 69,
			costUsd: 0.0012,
			topFunderScore: 79,
			funderIds: ['F4320320300', 'F4320332161', 'F4320334506', 'F4320338440', 'F4320320997']
		}
	},
	{
		caseId: 'climate-resilient-maize-farming',
		keyword: {
			candidateCount: 3,
			costUsd: 0.0001,
			topFunderScore: 73,
			funderIds: ['F4320323478', 'F4320320883', 'F4320320924']
		},
		combined: {
			candidateCount: 18,
			costUsd: 0.0012,
			topFunderScore: 77,
			funderIds: ['F4320320883', 'F4320323478', 'F4320306137', 'F4320320924', 'F4320306115']
		}
	},
	{
		caseId: 'maternal-health-digital-interventions',
		keyword: {
			candidateCount: 31,
			costUsd: 0.0001,
			topFunderScore: 82,
			funderIds: ['F4320332161', 'F4320334506', 'F4320306230', 'F4320334627', 'F4320319990']
		},
		combined: {
			candidateCount: 41,
			costUsd: 0.0012,
			topFunderScore: 82,
			funderIds: ['F4320332161', 'F4320334506', 'F4320306230', 'F4320319990', 'F4320334627']
		}
	},
	{
		caseId: 'coastal-erosion-climate-adaptation',
		keyword: {
			candidateCount: 49,
			costUsd: 0.0001,
			topFunderScore: 80,
			funderIds: ['F4320334631', 'F4320334630', 'F4320335087', 'F4320338348', 'F4320334779']
		},
		combined: {
			candidateCount: 62,
			costUsd: 0.0012,
			topFunderScore: 79,
			funderIds: ['F4320334631', 'F4320334630', 'F4320335087', 'F4320338348', 'F4320334779']
		}
	},
	{
		caseId: 'machine-learning-crop-disease',
		keyword: {
			candidateCount: 50,
			costUsd: 0.0001,
			topFunderScore: 70,
			funderIds: ['F4320334779', 'F4320335087', 'F4320334629', 'F4320334627', 'F4320306076']
		},
		combined: {
			candidateCount: 58,
			costUsd: 0.0012,
			topFunderScore: 72,
			funderIds: ['F4320334779', 'F4320334629', 'F4320335087', 'F4320334627', 'F4320306076']
		}
	}
];

export { RECORDED_CALIBRATION_RUNS, type RecordedCalibrationRun, type RecordedStrategyResult };
