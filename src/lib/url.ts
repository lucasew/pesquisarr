/**
 * Expand an IPv4-mapped IPv6 suffix (`127.0.0.1` or hextet form `7f00:1`) to dotted IPv4.
 * Returns null if the suffix is not a recognizable embedded IPv4.
 */
function embeddedIpv4FromMapped(suffix: string): string | null {
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(suffix)) {
		return suffix;
	}
	// WHATWG URL normalizes ::ffff:127.0.0.1 → ::ffff:7f00:1 (two hextets)
	const hextets = suffix.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
	if (!hextets) return null;
	const hi = parseInt(hextets[1], 16);
	const lo = parseInt(hextets[2], 16);
	return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

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
		// Strip IPv6 brackets and trailing FQDN dots (localhost. → localhost)
		let hostname = parsedUrl.hostname.replace(/[[\]]/g, '').replace(/\.+$/, '').toLowerCase();

		// IPv4-mapped IPv6 embeds an IPv4 in the last 32 bits (SSRF bypass if ignored).
		// WHATWG URL normalizes e.g. [::ffff:127.0.0.1] → ::ffff:7f00:1.
		const v4Mapped = hostname.match(/^::ffff:(.+)$/i);
		if (v4Mapped) {
			const embedded = embeddedIpv4FromMapped(v4Mapped[1]);
			if (!embedded) return false;
			hostname = embedded;
		}

		if (hostname === 'localhost' || hostname === '0' || hostname === '0.0.0.0') {
			return false;
		}

		// Unspecified addresses (often treated like local/any)
		if (hostname === '::' || hostname === '0:0:0:0:0:0:0:0') {
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
