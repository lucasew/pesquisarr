<script lang="ts">
	import { onMount } from 'svelte';
	import { Sun, Moon } from 'lucide-svelte';

	let isDark = false;

	onMount(() => {
		// Check saved theme preference or default to light
		const savedTheme = localStorage.getItem('theme') || 'light';
		isDark = savedTheme === 'dark';
		document.documentElement.setAttribute('data-theme', savedTheme);
	});

	function toggleTheme() {
		isDark = !isDark;
		const theme = isDark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}
</script>

<button on:click={toggleTheme} aria-label="Toggle theme" class="btn btn-ghost btn-circle">
	{#if isDark}
		<Sun size={24} />
	{:else}
		<Moon size={24} />
	{/if}
</button>
