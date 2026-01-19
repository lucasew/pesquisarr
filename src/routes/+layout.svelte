<script lang="ts">
	import { navigating } from '$app/stores';
	import ThemeToggle from '../components/ThemeToggle.svelte';
	import { Github, Play } from 'lucide-svelte';
	import '../app.css';
</script>

<svelte:head>
	<title>pesquisarr</title>
</svelte:head>

<!-- Progress bar at top when navigating -->
{#if $navigating}
	<progress
		class="progress w-full absolute top-0 left-0 bg-transparent [&::-webkit-progress-value]:bg-base-content/50 [&::-moz-progress-bar]:bg-base-content/50"
		style="border-radius: 0; z-index: 9999; height: 2px;"
	></progress>
{/if}

<div class="min-h-screen flex flex-col">
	<div class="container mx-auto px-4 flex-1 flex flex-col">
		<!-- Navbar -->
		<div class="navbar bg-base-100">
			<div class="navbar-start gap-2">
				<a href="/" class="btn btn-ghost p-1 h-12 w-12 min-h-0">
					<img src="/logo.png" alt="logo" class="h-full object-contain" />
				</a>
			</div>
			<div class="navbar-center hidden lg:flex">
				<!-- Empty -->
			</div>
			<div class="navbar-end gap-2">
				<a
					href="/api/stremio/manifest.json"
					target="_blank"
					class="btn btn-ghost btn-circle"
					aria-label="Stremio Manifest"
				>
					<Play size={24} />
				</a>
				<ThemeToggle />
				<a
					href="https://github.com/lucasew/cf-torrent"
					target="_blank"
					class="btn btn-ghost btn-circle"
					aria-label="GitHub"
				>
					<Github size={24} />
				</a>
			</div>
		</div>

		<div class="py-4 flex-1">
			<slot />
		</div>
	</div>
</div>
