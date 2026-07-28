<script lang="ts">
	import { Search } from 'lucide-svelte';

	let {
		initialQuery = '',
		placeholder = 'Pesquisar torrents...',
		size = 'normal'
	}: {
		initialQuery?: string;
		placeholder?: string;
		size?: 'normal' | 'large';
	} = $props();

	let query = $state(initialQuery);

	function handleSearch(event: Event) {
		event.preventDefault();
		if (query.trim()) {
			window.location.href = `/search?query=${encodeURIComponent(query)}`;
		}
	}
</script>

<form onsubmit={handleSearch} class={size === 'large' ? 'w-full max-w-2xl' : 'w-full'}>
	<div
		class="join w-full rounded-full overflow-hidden border border-base-content/10 focus-within:border-base-content/50 transition-all"
	>
		<input
			type="text"
			class={`input input-ghost join-item flex-1 focus:outline-none ${size === 'large' ? 'h-16 text-lg' : ''}`}
			{placeholder}
			bind:value={query}
		/>
		<button
			type="submit"
			class={`btn btn-ghost join-item border-none ${size === 'large' ? 'h-16 px-10' : 'px-6'}`}
			aria-label="Buscar"
		>
			<Search size={size === 'large' ? 24 : 18} />
		</button>
	</div>
</form>
