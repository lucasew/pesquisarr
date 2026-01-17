export type Services = import('$lib/server/services').Services;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			services: Services;
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
