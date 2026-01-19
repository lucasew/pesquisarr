<script lang="ts">
	export let torrent: string;

	const torrentURL = new URL(torrent);
</script>

<div class="card bg-base-100 shadow-xl mb-3">
	<div class="card-body">
		<div class="flex items-center gap-2 mb-2">
			<h2 class="card-title">{torrentURL.searchParams.get('dn') || '(NO NAME)'}</h2>
		</div>

		<div class="space-y-2">
			<div>
				<h3 class="font-bold">Trackers</h3>
				<ul class="list-disc list-inside text-sm">
					{#each torrentURL.searchParams.getAll('tr') || [] as tracker (tracker)}
						<li class="truncate">{tracker}</li>
					{/each}
				</ul>
			</div>

			<div>
				<h3 class="font-bold">Infohash</h3>
				<ul class="list-disc list-inside text-sm">
					<li class="truncate">
						{torrentURL.searchParams.get('xt')?.replace('urn:', '').replace('btih:', '')}
					</li>
				</ul>
			</div>
		</div>

		<div class="card-actions justify-end mt-4">
			<a href={torrent} target="_blank" class="btn btn-primary">Download</a>
		</div>
	</div>
</div>
