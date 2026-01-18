<script lang="ts">
	import { SvelteURL } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let url = $page.url;
	let query = $page.url.searchParams.get('query');
	let use_google =
		$page.url.searchParams.get('use_google') !== '0' &&
		$page.url.searchParams.get('use_google') !== 'false';
	let use_duckduckgo =
		$page.url.searchParams.get('use_duckduckgo') !== '0' &&
		$page.url.searchParams.get('use_duckduckgo') !== 'false';
	let use_yandex =
		$page.url.searchParams.get('use_yandex') !== '0' &&
		$page.url.searchParams.get('use_yandex') !== 'false';

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		let newURL = new SvelteURL(url.toString());
		if (!newURL.href.endsWith('/result')) {
			newURL.href += '/result';
		}
		newURL.searchParams.set('query', String(query));
		newURL.searchParams.set('use_google', use_google ? '1' : '0');
		newURL.searchParams.set('use_duckduckgo', use_duckduckgo ? '1' : '0');
		newURL.searchParams.set('use_yandex', use_yandex ? '1' : '0');
		goto(newURL);
	}
</script>

<div class="breadcrumbs text-sm">
	<ul>
		<li><a href="/">Home</a></li>
		<li>Search Torrent</li>
		{#if url.searchParams.get('query')}
			<li>{url.searchParams.get('query')}</li>
		{/if}
	</ul>
</div>

<form on:submit={handleFormSubmit} class="space-y-4">
	<div class="form-control w-full">
		<label class="label" for="query">
			<span class="label-text">Query</span>
		</label>
		<input
			id="query"
			type="text"
			bind:value={query}
			placeholder="Query to search"
			class="input input-bordered w-full"
		/>
	</div>

	<div class="form-control">
		<label class="label cursor-pointer justify-start gap-2">
			<input type="checkbox" bind:checked={use_google} class="checkbox checkbox-primary" />
			<span class="label-text">Use Google</span>
		</label>
		<label class="label cursor-pointer justify-start gap-2">
			<input type="checkbox" bind:checked={use_duckduckgo} class="checkbox checkbox-primary" />
			<span class="label-text">Use DuckDuckGO</span>
		</label>
		<label class="label cursor-pointer justify-start gap-2">
			<input type="checkbox" bind:checked={use_yandex} class="checkbox checkbox-primary" />
			<span class="label-text">Use Yandex</span>
		</label>
	</div>

	<button type="submit" class="btn btn-primary">Search</button>
</form>

<div class="divider"></div>

<slot />
