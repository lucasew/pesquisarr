<script lang="ts">
  import type { SearchResult } from "$lib/search";

  export let data: { links?: SearchResult[], rankedLinks?: SearchResult[] };
  let enable_filter = false;
  
  // Alterna entre a lista original e a lista processada pelo RankService
  $: links = enable_filter ? (data.rankedLinks || []) : (data.links || []);
</script>

<div class="form-control">
  <label class="label cursor-pointer justify-start gap-2">
    <input type="checkbox" bind:checked={enable_filter} class="checkbox checkbox-primary" />
    <span class="label-text">Enable quality filter (RankService)</span>
  </label>
</div>

<div class="divider"></div>

{#if links && links.length > 0}
  <ul class="space-y-2">
    {#each links as result (result.link)}
      <li class="flex items-center gap-2">
        <a href={result.link} target="_blank" rel="noopener noreferrer" class="link link-primary">{result.link}</a>
        <span class="badge badge-secondary">{result.source}</span>
      </li>
    {/each}
  </ul>
{:else}
    <p class="text-base-content/70">No items found</p>
{/if}
