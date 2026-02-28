import DOMPurify from 'dompurify';
import { parseHTML } from 'linkedom';

export function matchFirstGroup(text: string, regex: RegExp): string[] {
	const matches = [];
	let match;
	while ((match = regex.exec(text)) !== null) {
		matches.push(match[1]);
	}
	return matches;
}

const { window } = parseHTML('');
const purify = DOMPurify(window as unknown as Window);

export function htmlSanitize(str: string): string {
	return purify.sanitize(str);
}
