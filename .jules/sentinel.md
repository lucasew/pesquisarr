# Sentinel's Journal - CRITICAL LEARNINGS ONLY
## 2024-05-22 - Stricter IMDB ID Validation
**Vulnerability:** The regex for validating IMDB IDs (`/^tt\d+$/`) was too permissive, allowing for strings of arbitrary length. This could potentially lead to a Regular Expression Denial of Service (ReDoS) attack.
**Learning:** Input validation, even when it seems robust, should always consider edge cases and potential for abuse. In this case, the lack of a length limit was the primary oversight.
**Prevention:** Always enforce reasonable length limits on user-provided input, especially when it is used in regex matching. This is a simple but effective way to prevent ReDoS and other DoS-style attacks.
## 2024-05-23 - SSRF Bypass via Alternative Localhost Representations
**Vulnerability:** The `isValidHttpUrl` function did not block localhost representations like `'0'` or `'0.0.0.0'`, creating a Server-Side Request Forgery (SSRF) vulnerability. An attacker could craft a URL that would cause the server to make a request to itself or other internal services.
**Learning:** SSRF protection must be comprehensive. It's not enough to just block `localhost`; all alternative representations and special IP addresses that resolve to the local machine must also be blocked. The presence of failing unit tests for these bypasses was a clear indicator of the vulnerability and reinforces the value of a strong, security-aware test suite.
**Prevention:** When implementing security filters, especially for SSRF, it's crucial to research and test for common bypass techniques. URL validation logic should be regularly reviewed and updated to include new bypass methods as they become known.
## 2024-05-24 - Centralize API Response Logic
**Vulnerability:** Inconsistent response generation in API endpoints. The `series` endpoint constructed JSON responses manually, while the `movie` endpoint used a centralized `json` helper. This inconsistency could lead to security misconfigurations, such as missing or incorrect `Access-Control-Allow-Origin` headers.
**Learning:** Centralizing common functionality, especially for security-sensitive operations like response generation, is crucial for maintaining a consistent security posture. Manual implementations are prone to error and can easily diverge over time.
**Prevention:** Always use centralized helper functions for common tasks like generating API responses. This ensures that security headers and other important settings are applied consistently across all endpoints.
## 2026-01-17 - Sanitize Magnet Link Display Names
**Vulnerability:** The `getTorrentStreams` function extracted the `dn` (display name) parameter from magnet links and returned it in the API response without sanitization. This created a potential Stored XSS vulnerability if the consumer (frontend or Stremio) rendered the title as HTML.
**Learning:** Data from external sources, even seemingly harmless query parameters in magnet links, must be treated as untrusted. XSS payloads can be injected anywhere.
**Prevention:** Always sanitize user-controllable data before returning it in an API response or rendering it, especially when dealing with data scraped from the wild.
