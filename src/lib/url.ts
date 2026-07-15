/**
 * Checks if a given string is a valid and safe HTTP/HTTPS URL.
 * @param url The URL string to validate.
 * @returns `true` if the URL is valid and safe, `false` otherwise.
 */
export function isValidHttpUrl(url: string): boolean {
	try {
		const parsedUrl = new URL(url);

		// 1. Check for valid protocols
		if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
			return false;
		}

		// 2. Prevent requests to internal or reserved IP addresses
		const hostname = parsedUrl.hostname.replace(/[[\]]/g, '');

		if (hostname.toLowerCase() === 'localhost' || hostname === '0' || hostname === '0.0.0.0') {
			return false;
		}

		const privateIpRegexes = [
			/^127\./, // IPv4 loopback: 127.0.0.0/8
			/^10\./, // IPv4 private Class A: 10.0.0.0/8
			/^172\.(1[6-9]|2[0-9]|3[0-1])\./, // IPv4 private Class B: 172.16.0.0/12
			/^192\.168\./, // IPv4 private Class C: 192.168.0.0/16
			/^169\.254\./, // IPv4 link-local: 169.254.0.0/16 (includes cloud metadata 169.254.169.254)
			/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // IPv4 CGNAT: 100.64.0.0/10
			/^::1$/, // IPv6 loopback: ::1
			// IPv6 unique local addresses: fc00::/7 (covers both fc00::/8 and fd00::/8)
			/^f[cd][0-9a-f]{2}:/i,
			/^fe[89ab][0-9a-f]:/i // IPv6 link-local: fe80::/10
		];

		if (privateIpRegexes.some((regex) => regex.test(hostname))) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
}
