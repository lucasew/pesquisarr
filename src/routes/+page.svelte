<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let query = '';
	$: suggestion = data.suggestion;

	function handleSearch() {
		if (query.trim()) {
			goto(`/search?query=${encodeURIComponent(query)}`);
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] gap-8">
	<img src="/logo.png" alt="pesquisarr" class="max-w-[300px] w-full" />

	<form on:submit|preventDefault={handleSearch} class="w-full max-w-2xl">
		<div
			class="join w-full rounded-full overflow-hidden border border-base-content/10 focus-within:border-base-content/50 transition-all"
		>
			<input
				type="text"
				class="input input-ghost join-item flex-1 h-16 text-lg focus:outline-none"
				placeholder={suggestion}
				bind:value={query}
			/>
			<button
				type="submit"
				class="btn btn-ghost join-item h-16 px-10 border-none"
				aria-label="Buscar"
			>
				<Search size={24} />
			</button>
		</div>
	</form>
</div>
