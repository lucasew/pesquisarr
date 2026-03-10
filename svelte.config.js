import autoAdapter from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';
import workersAdapter from '@sveltejs/adapter-cloudflare';
import multiAdapter from '@macfja/svelte-multi-adapter';

const enableWorkers = true;

let adapters = [nodeAdapter(), autoAdapter()];

if (enableWorkers) {
				adapters.push(workersAdapter());
}

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
				// Consult https://kit.svelte.dev/docs/integrations#preprocessors
				// for more information about preprocessors
				preprocess: vitePreprocess(),

				kit: {
				 // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
					// If your environment is not supported or you settled on a specific environment, switch out the adapter.
					// See https://kit.svelte.dev/docs/adapters for more information about adapters.
					adapter: multiAdapter(adapters),

				 experimental: {
					 tracing: {
						 server: false
						},

					 instrumentation: {
						 server: true
						}
					}
				}
};

export default config;