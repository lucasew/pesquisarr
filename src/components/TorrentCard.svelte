<script lang="ts">
	import { Download } from 'lucide-svelte';
	export let torrent: string;

	const torrentURL = new URL(torrent);
</script>

<div class="card bg-base-100 shadow-sm border border-base-content/10 mb-3">
	<div class="card-body p-6">
		<div class="flex items-center justify-between gap-2 mb-2">
			<h2 class="card-title text-lg break-all">
				{torrentURL.searchParams.get('dn') || '(NO NAME)'}
			</h2>
			<a
				href={torrent}
				target="_blank"
				class="btn btn-ghost btn-circle"
				aria-label="Download"
				title="Download"
			>
				<Download size={24} />
			</a>
		</div>

		<div class="space-y-4 opacity-70">
			<div>
				<h3 class="text-xs uppercase tracking-wider font-bold mb-1">Trackers</h3>
				<ul class="list-none text-sm">
					{#each torrentURL.searchParams.getAll('tr')?.slice(0, 3) || [] as tracker (tracker)}
						<li class="truncate">{tracker}</li>
					{/each}
					{#if (torrentURL.searchParams.getAll('tr')?.length || 0) > 3}
						<li class="text-xs italic">
							... e mais {torrentURL.searchParams.getAll('tr').length - 3}
						</li>
					{/if}
				</ul>
			</div>

			<div>
				<h3 class="text-xs uppercase tracking-wider font-bold mb-1">Infohash</h3>
				<p class="text-sm font-mono break-all leading-none">
					{torrentURL.searchParams.get('xt')?.replace('urn:', '').replace('btih:', '')}
				</p>
			</div>
		</div>
	</div>
</div>
