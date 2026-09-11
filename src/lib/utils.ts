/**
 * Capture every first-group match of `regex` against `text`.
 * Resets `regex.lastIndex` so a shared `/g` instance (e.g. a service field)
 * can be reused across calls without silently returning an empty list.
 */
export function matchFirstGroup(text: string, regex: RegExp): string[] {
	const matches: string[] = [];
	regex.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		if (match[1] !== undefined) {
			matches.push(match[1]);
		}
	}
	return matches;
}

/**
 * Strip HTML from untrusted strings used as plain text (IMDb titles → search
 * queries, etc.).
 *
 * Previously this used DOMPurify + linkedom. linkedom does not implement
 * `document.implementation`, so DOMPurify never marks itself supported and
 * `sanitize()` is a silent no-op — scripts and event-handler attributes
 * passed through unchanged. A pure string strip is reliable on Workers and
 * Node without a DOM polyfill.
 */
export function htmlSanitize(str: string): string {
	if (typeof str !== 'string' || str.length === 0) {
		return '';
	}
	// Drop tags, then neutralize any residual angle brackets.
	return str
		.replace(/<[^>]*>/g, '')
		.replace(/[<>]/g, '')
		.trim();
}
