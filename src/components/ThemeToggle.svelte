<script lang="ts">
	import { onMount } from 'svelte';
	import { Sun, Moon } from 'lucide-svelte';

	let isDark = $state(false);

	onMount(() => {
		const applied = document.documentElement.getAttribute('data-theme') || 'light';
		isDark = applied === 'dark';
	});

	function toggleTheme() {
		isDark = !isDark;
		const theme = isDark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}
</script>

<button onclick={toggleTheme} aria-label="Toggle theme" class="btn btn-ghost btn-circle">
	{#if isDark}
		<Sun size={24} />
	{:else}
		<Moon size={24} />
	{/if}
</button>
