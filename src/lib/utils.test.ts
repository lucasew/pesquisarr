import { describe, it, expect } from 'vitest';
import { htmlSanitize, matchFirstGroup } from './utils';

describe('htmlSanitize', () => {
	it('strips script tags instead of passing them through', () => {
		// Regression: DOMPurify+linkedom was a no-op and returned this unchanged.
		expect(htmlSanitize('<script>alert(1)</script>')).toBe('alert(1)');
	});

	it('strips tags and event-handler attributes', () => {
		expect(htmlSanitize('<img src=x onerror=alert(1)>hi')).toBe('hi');
		expect(htmlSanitize('Safe <b>bold</b> text')).toBe('Safe bold text');
	});

	it('leaves plain titles unchanged (including & for search queries)', () => {
		expect(htmlSanitize('The Shawshank Redemption')).toBe('The Shawshank Redemption');
		expect(htmlSanitize('Foo & Bar')).toBe('Foo & Bar');
		expect(htmlSanitize('  spaced  ')).toBe('spaced');
	});

	it('returns empty string for empty and non-string input', () => {
		expect(htmlSanitize('')).toBe('');
		expect(htmlSanitize(undefined as unknown as string)).toBe('');
		expect(htmlSanitize(null as unknown as string)).toBe('');
	});
});

describe('matchFirstGroup', () => {
	it('returns every first capture group', () => {
		const re = /href="([^"]+)"/g;
		expect(matchFirstGroup('<a href="a"><a href="b">', re)).toEqual(['a', 'b']);
	});

	it('resets lastIndex so a shared /g regex can be reused', () => {
		const re = /x=(\d+)/g;
		expect(matchFirstGroup('x=1 x=2', re)).toEqual(['1', '2']);
		// Without lastIndex = 0 this would start at the previous end and return [].
		expect(matchFirstGroup('x=3 x=4', re)).toEqual(['3', '4']);
	});
});
