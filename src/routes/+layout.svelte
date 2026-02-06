<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/state";

	let { children } = $props();

	const links = [
		{ href: "/", label: "Home" },
		{ href: "/import", label: "Import" },
		{ href: "/weekly", label: "Weekly" }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="border-b border-gray-200 bg-white">
	<div class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-3">
		<span class="text-lg font-bold text-gray-900">El Tracker</span>
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="text-sm font-medium {page.url.pathname === link.href
					? 'text-blue-600'
					: 'text-gray-600 hover:text-gray-900'}"
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>

{@render children()}
