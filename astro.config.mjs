import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

const useNode = process.env.ASTRO_ADAPTER === 'node';

// https://astro.build/config
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
		sentry({
			org: 'lucao-enterprise',
			project: 'pesquisarr',
			sourceMapsUploadOptions: {
				enabled: false
			}
		})
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
