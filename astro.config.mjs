import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

const useNode = process.env.ASTRO_ADAPTER === 'node';
const sentryDisabled = process.env.SENTRY_DISABLED === '1';

// https://astro.build/config
// Sentry: https://docs.sentry.io/platforms/javascript/guides/astro/
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
		// Keep integration for production; configs use `enabled: import.meta.env.PROD` so local is safe.
		// Pass SENTRY_DISABLED=1 at build time to omit the integration entirely (extra-safe for wrangler).
		...(sentryDisabled
			? []
			: [
					sentry({
						org: 'lucao-enterprise',
						project: 'pesquisarr',
						authToken: process.env.SENTRY_AUTH_TOKEN,
						sourceMapsUploadOptions: {
							enabled: Boolean(process.env.SENTRY_AUTH_TOKEN)
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
