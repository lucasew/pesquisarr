import he from 'he';

export function matchFirstGroup(text: string, regex: RegExp): string[] {
	const matches = [];
	let match;
	while ((match = regex.exec(text)) !== null) {
		matches.push(match[1]);
	}
	return matches;
}

export function htmlSanitize(str: string): string {
	return he.encode(str);
}
