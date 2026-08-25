const MAX_AWARD_TITLE_LENGTH = 240;
const MAX_FALLBACK_SCHEME_LENGTH = 160;

type AwardDisplayInput = {
	title: string | null;
	description: string | null;
	scheme: string | null;
	funderAwardId: string | null;
};

type AwardDisplay = {
	title: string;
	description: string | null;
};

const normalizeText = (value: string | null) => value?.replace(/\s+/g, ' ').trim() || null;

const normalizeComparableText = (value: string) =>
	value
		.toLocaleLowerCase('en')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

const isDuplicateText = ({ first, second }: { first: string; second: string }) =>
	normalizeComparableText(first) === normalizeComparableText(second);

const getFallbackTitle = ({
	scheme,
	funderAwardId,
	hasDescription
}: {
	scheme: string | null;
	funderAwardId: string | null;
	hasDescription: boolean;
}) => {
	if (scheme && scheme.length <= MAX_FALLBACK_SCHEME_LENGTH) return scheme;
	if (funderAwardId) return `Award ${funderAwardId}`;
	return hasDescription ? 'Award record' : 'Untitled award';
};

const getAwardDisplay = ({
	title: rawTitle,
	description: rawDescription,
	scheme: rawScheme,
	funderAwardId: rawFunderAwardId
}: AwardDisplayInput): AwardDisplay => {
	const title = normalizeText(rawTitle);
	const description = normalizeText(rawDescription);
	const scheme = normalizeText(rawScheme);
	const funderAwardId = normalizeText(rawFunderAwardId);
	const hasNarrativeTitle = Boolean(title && title.length > MAX_AWARD_TITLE_LENGTH);
	const displayDescription = hasNarrativeTitle ? (description ?? title) : description;
	const displayTitle =
		title && !hasNarrativeTitle
			? title
			: getFallbackTitle({
					scheme,
					funderAwardId,
					hasDescription: Boolean(displayDescription)
				});

	return {
		title: displayTitle,
		description:
			displayDescription && !isDuplicateText({ first: displayTitle, second: displayDescription })
				? displayDescription
				: null
	};
};

export { getAwardDisplay, MAX_AWARD_TITLE_LENGTH, type AwardDisplay, type AwardDisplayInput };
