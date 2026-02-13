<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Zap } from "@lucide/svelte";

	const links = [
		{ title: "Importera", href: "/import" },
		{ title: "Vecka", href: "/weekly" },
		{ title: "Månad", href: "/monthly" },
		{ title: "År", href: "/yearly" },
		{ title: "Mönster", href: "/patterns" },
		{ title: "Mål", href: "/targets" }
	];
</script>

<nav class="border-b" aria-label="Main navigation">
	<div class="container mx-auto flex items-center gap-1 px-4 py-2">
		<a href="/" class="mr-4 flex items-center gap-2 font-semibold">
			<Zap class="h-5 w-5" />
			<span class="hidden sm:inline">El Tracker</span>
		</a>
		{#each links as link (link.href)}
			<Button
				href={link.href}
				variant={page.url.pathname.startsWith(link.href) ? "secondary" : "ghost"}
				size="sm"
			>
				{link.title}
			</Button>
		{/each}
	</div>
</nav>
