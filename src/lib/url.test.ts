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

	it('should return true for valid public URLs', () => {
		expect(isValidHttpUrl('https://google.com')).toBe(true);
		expect(isValidHttpUrl('http://github.com/lucasew')).toBe(true);
	});

	it('should return false for private IP ranges', () => {
		expect(isValidHttpUrl('http://192.168.1.1')).toBe(false);
		expect(isValidHttpUrl('http://10.0.0.1')).toBe(false);
		expect(isValidHttpUrl('http://127.0.0.1')).toBe(false);
		expect(isValidHttpUrl('http://localhost')).toBe(false);
	});
});
