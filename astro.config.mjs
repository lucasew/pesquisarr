import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

const useNode = process.env.ASTRO_ADAPTER === 'node';
const sentryDisabled = process.env.SENTRY_DISABLED === '1';
const cfWorkersStub = fileURLToPath(
	new URL('./src/lib/server/cloudflare-workers-stub.ts', import.meta.url)
);

// https://astro.build/config
// Sentry: server-only via @sentry/astro (no @sentry/cloudflare — Astro integration covers Workers SSR).
// https://docs.sentry.io/platforms/javascript/guides/astro/
export default defineConfig({
	output: 'server',
	adapter: useNode
		? node({ mode: 'standalone' })
		: cloudflare({
				platformProxy: {
					enabled: true
				}
			}),
	integrations: [
		svelte(),
		...(sentryDisabled
			? []
			: [
					sentry({
						// No client/replay SDK — reporting is SSR/worker (ErrorService + request middleware)
						enabled: {
							client: false,
							server: true
						},
						org: 'lucao-enterprise',
						project: 'pesquisarr',
						authToken: process.env.SENTRY_AUTH_TOKEN,
						sourceMapsUploadOptions: {
							enabled: Boolean(process.env.SENTRY_AUTH_TOKEN)
						},
						autoInstrumentation: {
							requestHandler: true
						}
					})
				])
	],
	vite: {
		// Node/Docker: `cloudflare:workers` is a workerd virtual module and does not exist for Rollup.
		// Point it at a tiny stub so the same worker-env.ts source builds on both adapters.
		resolve: useNode
			? {
					alias: {
						'cloudflare:workers': cfWorkersStub
					}
				}
			: undefined,
		plugins: [
			paraglideVitePlugin({
				project: './project.inlang',
				outdir: './src/lib/paraglide'
			})
		],
		ssr: {
			noExternal: ['@popperjs/core']
		},
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		}
	}
});
