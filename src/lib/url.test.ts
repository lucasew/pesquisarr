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

	it('should return false for IPv4 link-local and cloud metadata addresses', () => {
		expect(isValidHttpUrl('http://169.254.169.254')).toBe(false);
		expect(isValidHttpUrl('http://169.254.0.1')).toBe(false);
		expect(isValidHttpUrl('https://169.254.1.1/latest/meta-data/')).toBe(false);
	});

	it('should return false for IPv4 CGNAT range 100.64.0.0/10', () => {
		expect(isValidHttpUrl('http://100.64.0.1')).toBe(false);
		expect(isValidHttpUrl('http://100.100.0.1')).toBe(false);
		expect(isValidHttpUrl('http://100.127.255.254')).toBe(false);
	});

	it('should return true for public 100.x addresses outside CGNAT', () => {
		expect(isValidHttpUrl('http://100.63.255.255')).toBe(true);
		expect(isValidHttpUrl('http://100.128.0.1')).toBe(true);
	});

	it('should return false for IPv6 link-local addresses', () => {
		expect(isValidHttpUrl('http://[fe80::1]')).toBe(false);
		expect(isValidHttpUrl('http://[fe80::a00:27ff:fe4e:66a1]')).toBe(false);
		expect(isValidHttpUrl('http://[febf:ffff::1]')).toBe(false);
	});
});
