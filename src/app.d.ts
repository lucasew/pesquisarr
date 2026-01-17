// See https://kit.svelte.dev/docs/types#app

import type { Services } from '$lib/server/services';

// for information about these interfaces
declare global {
	namespace App {
		// interface PageData {}
		interface Platform {
			env?: Record<string, unknown>;
			context?: {
				waitUntil(promise: Promise<unknown>): void;
			};
			services?: Services;
		}
		interface RequestEvent {
			services: Services;
		}
	}
}

declare module '@sveltejs/kit' {
	interface RequestEvent {
		services: Services;
	}
}

export {};
