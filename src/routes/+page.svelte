<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	let query = '';

	function handleSearch() {
		if (query.trim()) {
			goto(`/search?query=${encodeURIComponent(query)}`);
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] gap-8">
	<img src="/logo.png" alt="pesquisarr" class="max-w-[300px] w-full" />

	<form on:submit|preventDefault={handleSearch} class="w-full max-w-2xl flex flex-col gap-4">
		<div class="join w-full shadow-lg rounded-full overflow-hidden border border-primary">
			<label
				class="input input-ghost flex items-center gap-2 flex-1 join-item h-16 text-lg focus-within:outline-none border-none"
			>
				<Search size={24} class="opacity-70 text-primary" />
				<input
					type="text"
					class="grow"
					placeholder="O que você quer baixar hoje?"
					bind:value={query}
				/>
			</label>
			<button type="submit" class="btn btn-primary join-item h-16 px-10 text-lg border-none"
				>Buscar</button
			>
		</div>
	</form>
</div>
