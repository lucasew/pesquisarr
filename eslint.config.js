import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import eslintPluginAstro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	...eslintPluginAstro.configs.recommended,
	prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.ts', '**/*.astro'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		},
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/prefer-svelte-reactivity': 'off'
		}
	},
	{
		files: ['src/env.d.ts'],
		rules: {
			'@typescript-eslint/triple-slash-reference': 'off'
		}
	},
	{
		files: ['src/lib/server/services/torrent/bencode_decode.ts'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off'
		}
	},
	{
		ignores: [
			'*.cjs',
			'.github',
			'patches',
			'project.inlang',
			'static',
			'public',
			'build',
			'dist',
			'src/lib/paraglide/',
			'.astro/'
		]
	}
];
