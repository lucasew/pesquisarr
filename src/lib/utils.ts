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

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function htmlSanitize(str: string): string {
	return purify.sanitize(str);
}












