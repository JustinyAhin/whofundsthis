type RecordedFunderEvidence = {
	id: string;
	score: number;
	awardCount: number;
	bestAwardTitle: string | null;
};

const RAW_RECORDED_COMBINED_EVIDENCE: Record<
	string,
	Array<[string, number, number, string | null]>
> = {
	'pregnancy-malaria-vaccine': [
		['F4320320300', 79, 6, 'Clinical development of a VAR2CSA-based placental malaria vaccine'],
		[
			'F4320332161',
			75,
			10,
			'Exploiting cross-reactive, conserved epitopes in Plasmodium vivax to develop a vaccine against falciparum placental malaria.'
		],
		[
			'F4320334506',
			72,
			3,
			'Exploiting a cross-reactive epitope in Plasmodium vivax PvDBP to develop a vaccine against falciparum placental malaria'
		],
		[
			'F4320338440',
			69,
			1,
			'Advancing The Clinical Development Of Placental Malaria Vaccines In The Context Of Capacity Building and Use Of Digital Health Technologies'
		],
		[
			'F4320320997',
			68,
			1,
			'A novel approach to identify the specific antibody characteristics important for protection from malaria in pregnant women'
		],
		[
			'F4320338337',
			68,
			1,
			'High-Throughput Mapping of Antibody Sequences to Antigen Specificity in Placental Malaria'
		],
		[
			'F4320311904',
			67,
			7,
			'Prenatal malaria exposure and infant health and development: A prospective birth cohort study (PRiME)'
		],
		['F4320334626', 67, 6, 'Glasgow Maternal and Infant RSV Immunity Study (GLAMIRIS)'],
		['F4320338335', 67, 1, 'Drug Repurposing for Malaria Chemoprotection'],
		[
			'F4320334764',
			66,
			2,
			'Screening of novel malaria vaccine candidates with protective immune sera'
		]
	],
	'climate-resilient-maize-farming': [
		[
			'F4320320883',
			77,
			1,
			'Use of Tomato lines tolerant to Proximity shade to Increase yield and Quality in intercropping agrosystems'
		],
		[
			'F4320323478',
			73,
			1,
			'Enhancing the sustainability of food security and nutrition through adaptation strategies for climate-resilient crop production in Zanzibar.'
		],
		[
			'F4320306137',
			72,
			1,
			'Centro Internacional de Mejoramiento de Maiz y Trigo - to accelerate the development and delivery of more productive, climate-resilient, market-demanded, and nutritious maize and wheat varieties'
		],
		['F4320320924', 68, 1, 'Food System Optimization for Maternal and Child Nutrition in Zambia'],
		['F4320306115', 48, 3, 'CGIAR FUND GRANT W/ WORLD BANK'],
		['F4320321001', 45, 1, null],
		['F4320335777', 45, 5, null],
		['F4320329182', 43, 2, null],
		['F4320335787', 42, 1, null],
		['F4320332299', 42, 1, null]
	],
	'maternal-health-digital-interventions': [
		[
			'F4320332161',
			82,
			7,
			'Sensing Technologies for maternal depression treatment in low resource settings (StandStrong)'
		],
		[
			'F4320334506',
			77,
			2,
			'Adaptation and Pilot Evaluation of a Digital Intervention Targeting the Psychosocial Needs of Individuals with Pregestational Diabetes: A Mixed-Methods Multi Phase Study'
		],
		[
			'F4320319990',
			69,
			1,
			'The Digitalisation of Sexual and Reproductive Healthcare: Black Women’s Inclusion and Exclusion in Prevention, Services and Care (Midlands and London)'
		],
		['F4320306230', 69, 1, 'P3 Providing an Optimized and emPowered Pregnancy for You (POPPY)'],
		[
			'F4320334627',
			68,
			1,
			'Co-designing Community-based ICTs Interventions to Enhance Maternal and Child Health in South Africa'
		],
		[
			'F4320338440',
			68,
			1,
			'Implementation of an Integrated Digital Health System for Infectious Diseases in Maternal and Child Health In East Africa'
		],
		[
			'F4320311904',
			67,
			2,
			'Olfactory communication in the first weeks of life: from chemical mechanisms to improving breastfeeding outcomes'
		],
		[
			'F4320320300',
			67,
			1,
			'Implementation of an Integrated Digital Health System for Infectious Diseases in Maternal and Child Health In East Africa'
		],
		[
			'F4320323299',
			67,
			7,
			'Covid-19 and the Kenyan health system: a collaborative ethnographic study'
		],
		[
			'F4320334626',
			66,
			1,
			'Infant predictors of neurodevelopmental outcomes in early-onset epilepsy: integrating video-based electronic health records'
		]
	],
	'coastal-erosion-climate-adaptation': [
		[
			'F4320334631',
			79,
			11,
			"Future proofing Scotland's remote coastal areas: evaluation of the potential for nature-based coastal adaptation"
		],
		[
			'F4320334630',
			74,
			3,
			'Building resilience in coastal governance: ethics and justice in responsible innovation'
		],
		[
			'F4320335087',
			74,
			1,
			'Coastal ecosystem accounting software to accelerate private sector investment into underserved blue carbon and biodiversity credits'
		],
		[
			'F4320338348',
			72,
			2,
			'Large scale RESToration of COASTal ecosystems through rivers to sea connectivity'
		],
		[
			'F4320321800',
			71,
			1,
			'Salt marshes: where climate change adaptation meets climate change mitigation'
		],
		[
			'F4320334779',
			71,
			1,
			'Predictive modelling of climate change impact on dune morphodynamics towards resilient coastal communities using Machine Learning'
		],
		['F4320320300', 69, 6, 'Smart Control of the Climate Resilience in European Coastal Cities'],
		[
			'F4320338438',
			69,
			1,
			'Detection and Global Risk Assessment of Coastal Transitional Climate and Neo-climate Regions in a Warming World'
		],
		[
			'F4320338445',
			69,
			1,
			'Hotspot Resilience: Co-Construct Approaches to Coastal Climate Adaptation'
		],
		[
			'F4320321033',
			68,
			3,
			'Societal impacts of sea level rise induced erosion in southern Sweden (SISLER)'
		]
	],
	'machine-learning-crop-disease': [
		[
			'F4320334779',
			72,
			1,
			'FAIRice - Development of machine learning methods to optimize dry rice water usage and disease control using high-throughput phenotype screening'
		],
		[
			'F4320334629',
			71,
			9,
			'Developing Deep Learning Models And Tools To Score Plant Cell Death And Disease Lesion Severity'
		],
		[
			'F4320335087',
			70,
			10,
			'Machine-Cast: A scalable machine learning framework for forecasting risk of crop pests and pathogens'
		],
		[
			'F4320334627',
			69,
			2,
			'Beyond the visible - spectral imaging and analysis for crop health and yield monitoring'
		],
		[
			'F4320306076',
			69,
			13,
			'I-Corps: Translation Potential of a Nanosensor Platform for Detection of Molecular Markers Associated with Crop Diseases'
		],
		[
			'F4320334436',
			67,
			1,
			'Crop Sentry - AI-Driven Device for Real-Time Autonomous 3D Crop Monitoring'
		],
		['F4320322795', 64, 3, 'Application of Deep Learning in Water Resources and Smart Agriculture'],
		['F4320323299', 64, 2, 'Phenotyping for healthier and more productive wheat crops'],
		[
			'F4320334704',
			63,
			2,
			'Understanding disease resistance gene evolution across the Brassicaceae'
		],
		[
			'F4320327336',
			62,
			1,
			'ADMIRE: Association, causality and biomarker Discovery in translational MIcrobiome REsearch.'
		]
	]
};

const normalizeEvidence = (
	values: Array<[string, number, number, string | null]>
): RecordedFunderEvidence[] =>
	values.map(([id, score, awardCount, bestAwardTitle]) => ({
		id,
		score,
		awardCount,
		bestAwardTitle
	}));

const RECORDED_COMBINED_EVIDENCE = Object.fromEntries(
	Object.entries(RAW_RECORDED_COMBINED_EVIDENCE).map(([caseId, values]) => [
		caseId,
		normalizeEvidence(values)
	])
) as Record<string, RecordedFunderEvidence[]>;

export { RECORDED_COMBINED_EVIDENCE, type RecordedFunderEvidence };
