<script lang="ts">
	import { Search } from 'lucide-svelte';

	export let suggestion = '';

	let query = '';

	function handleSearch(event: Event) {
		event.preventDefault();
		if (query.trim()) {
			window.location.href = `/search?query=${encodeURIComponent(query)}`;
		}
	}
</script>

<form on:submit={handleSearch} class="w-full max-w-2xl">
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
