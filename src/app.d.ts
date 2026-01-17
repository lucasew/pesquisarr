import type { Services } from '$lib/server/services';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			services?: Services;
			[key: string]: unknown;
		}
		// interface PageData {}
		interface Platform {
			env?: Record<string, unknown>;
			context?: {
				waitUntil(promise: Promise<unknown>): void;
			};
			services?: Services;
		}
	}
}

declare module '@sveltejs/kit' {
	interface RequestEvent {
		services?: Services;
	}
}

export {};
