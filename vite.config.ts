import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		}),
		sveltekit()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		noExternal: ['@popperjs/core']
	}
});
