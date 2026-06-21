import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

const useNode = process.env.ASTRO_ADAPTER === 'node';
const sentryDisabled = process.env.SENTRY_DISABLED === '1';

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
