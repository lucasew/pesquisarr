<script lang="ts">
	import TorrentCard from '../../components/TorrentCard.svelte';

	export let data;
	$: links = data.links;
</script>

<svelte:head>
	<title>{data.query ? `${data.query} - pesquisarr` : 'pesquisarr'}</title>
</svelte:head>

<div class="space-y-4">
	{#if links && links.length > 0}
		{#each links as item (item.torrent)}
			<TorrentCard torrent={item.torrent} />
		{/each}
	{:else if data.query}
		<div class="text-center py-10">
			<p class="text-xl">Nenhum resultado encontrado para "{data.query}"</p>
		</div>
	{/if}
</div>
