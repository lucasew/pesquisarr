import type { AppEvent } from '../app-event';
import { vi } from 'vitest';

export function createMockEvent(): AppEvent {
	return {
		locals: {
			services: {
				error: { report: vi.fn() }
			}
		} as unknown as App.Locals,
		platform: {
			env: {}
		},
		request: new Request('http://localhost'),
		url: new URL('http://localhost'),
		params: {}
	};
}
