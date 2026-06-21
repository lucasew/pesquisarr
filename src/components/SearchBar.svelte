<script lang="ts">
	import { Search } from 'lucide-svelte';

	export let initialQuery = '';

	let query = initialQuery;

	function handleSearch(event: Event) {
		event.preventDefault();
		if (query.trim()) {
			window.location.href = `/search?query=${encodeURIComponent(query)}`;
		}
	}
</script>

<form on:submit={handleSearch} class="w-full">
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
