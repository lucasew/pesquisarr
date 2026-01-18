import { describe, it, expect } from 'vitest';
import { isValidHttpUrl } from './url';

describe('isValidHttpUrl', () => {
	it('should return false for bracketed IPv6 loopback address', () => {
		expect(isValidHttpUrl('http://[::1]')).toBe(false);
	});

	it('should return false for "0" as hostname', () => {
		expect(isValidHttpUrl('http://0')).toBe(false);
	});

	it('should return false for "0.0.0.0" as hostname', () => {
		expect(isValidHttpUrl('http://0.0.0.0')).toBe(false);
	});
});
