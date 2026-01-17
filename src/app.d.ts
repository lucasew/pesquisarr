import type { Services } from '$lib/server/services';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			[key: string]: unknown;
		}
		// interface PageData {}
		interface Platform {
			env?: Record<string, unknown>;
			context?: {
				waitUntil(promise: Promise<unknown>): void;
			};
		}
	}
}

declare module '@sveltejs/kit' {
	interface RequestEvent {
		services: Services;
	}
}

export {};
