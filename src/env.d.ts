/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { getServices } from './lib/server/services';

declare namespace App {
	interface Locals {
		services: ReturnType<typeof getServices>;
		locale?: string;
		/** Cloudflare execution context (Astro 6 @astrojs/cloudflare) */
		cfContext?: ExecutionContext;
	}
}

// Augment when wrangler types are generated
interface Env {
	[key: string]: unknown;
}

declare module 'cloudflare:workers' {
	export const env: Env;
}
