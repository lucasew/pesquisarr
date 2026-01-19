<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	let query = $page.url.searchParams.get('query') || '';

	function handleSearch() {
		if (query.trim()) {
			const url = new URL($page.url);
			url.pathname = '/search';
			url.searchParams.set('query', query);
			goto(url.toString());
		}
	}

	$: {
		const q = $page.url.searchParams.get('query');
		if (q !== null) {
			query = q;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-2 sticky top-0 bg-base-100 py-4 z-10">
		<form on:submit|preventDefault={handleSearch} class="flex-1 flex gap-2">
			<div
				class="join w-full shadow-sm rounded-full overflow-hidden border border-base-300 focus-within:border-primary transition-colors"
			>
				<label
					class="input input-ghost flex items-center gap-2 flex-1 join-item focus-within:outline-none border-none"
				>
					<Search size={18} class="opacity-70 text-primary" />
					<input type="text" class="grow" placeholder="Pesquisar torrents..." bind:value={query} />
				</label>
				<button type="submit" class="btn btn-primary join-item px-6 border-none">Buscar</button>
			</div>
		</form>
	</div>

	<slot />
</div>
