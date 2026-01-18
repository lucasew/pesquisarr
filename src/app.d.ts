import type { getServices } from "$lib/server/services";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			services: ReturnType<typeof getServices>;
			[key: string]: unknown;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Record<string, unknown>;
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
