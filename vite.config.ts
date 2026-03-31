import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
	plugins: [sentrySvelteKit({
        org: "lucao-enterprise",
        project: "pesquisarr"
    }), paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/lib/paraglide'
    }), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		noExternal: ['@popperjs/core']
	}
});