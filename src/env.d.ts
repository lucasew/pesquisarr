/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { getServices } from './lib/server/services';

interface CloudflareEnv {
	[key: string]: unknown;
}

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
	interface Locals extends Runtime {
		services: ReturnType<typeof getServices>;
		locale?: string;
	}
}
