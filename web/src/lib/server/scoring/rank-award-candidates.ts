import type { AwardCandidate } from '$lib/server/awards/types';

import { scoreAwardCandidate } from './score-award-candidate';
import type { AwardScoringContext, ScoredAwardCandidate } from './types';

const rankAwardCandidates = ({
	candidates,
	context
}: {
	candidates: AwardCandidate[];
	context: AwardScoringContext;
}): ScoredAwardCandidate[] => {
	const maxOpenAlexRelevance = Math.max(
		...candidates.map((candidate) => candidate.relevanceScore ?? 0),
		0
	);
	const scoringContext = { ...context, maxOpenAlexRelevance };

	return candidates
		.map((candidate) => ({
			candidate,
			score: scoreAwardCandidate({ candidate, context: scoringContext })
		}))
		.sort((left, right) => right.score.total - left.score.total);
};

export { rankAwardCandidates };
