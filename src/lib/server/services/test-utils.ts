import type { RequestEvent } from '@sveltejs/kit';
import { vi } from 'vitest';

export function createMockEvent(): RequestEvent {
	return {
		locals: {
			services: {}
		},
		platform: {
			env: {}
		},
		// @ts-expect-error - Partial mock
		request: new Request('http://localhost'),
		url: new URL('http://localhost'),
		params: {},
		route: { id: null },
		cookies: {} as unknown as RequestEvent['cookies'],
		fetch: vi.fn(),
		getClientAddress: vi.fn(),
		isDataRequest: false,
		setHeaders: vi.fn()
	} as unknown as RequestEvent;
}
