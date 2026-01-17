import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';


export function matchFirstGroup(text: string, regex: RegExp): string[] {
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

export function htmlSanitize(str: string): string {
    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
	return purify.sanitize(str);
}

export function isValidHttpUrl(string: string): boolean {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
}