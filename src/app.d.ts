// See https://kit.svelte.dev/docs/types#app

import type { initializeServices } from "$lib/server/services";

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
			services: ReturnType<typeof initializeServices>
		}
	}
}

declare module '@sveltejs/kit' {
	interface RequestEvent {
		services?: Services;
	}
}

export {};
