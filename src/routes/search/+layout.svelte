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
	<div class="sticky top-0 bg-base-100 py-4 z-10">
		<form on:submit|preventDefault={handleSearch} class="w-full">
			<div
				class="join w-full rounded-full overflow-hidden border border-base-content/10 focus-within:border-base-content/50 transition-all"
			>
				<input
					type="text"
					class="input input-ghost join-item flex-1 focus:outline-none"
					placeholder="Pesquisar torrents..."
					bind:value={query}
				/>
				<button type="submit" class="btn btn-ghost join-item px-6 border-none" aria-label="Buscar">
					<Search size={18} />
				</button>
			</div>
		</form>
	</div>

	<slot />
</div>
