<script lang="ts">
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import { Button } from "$lib/components/ui/button";
	import { Zap, Droplet, ArrowLeftRight, Sun, Moon } from "@lucide/svelte";
	import { toggleMode } from "mode-watcher";
	import { RESOURCE_CONFIG, type ResourceType } from "$lib/resource";

	interface Props {
		resource: ResourceType;
	}

	let { resource }: Props = $props();

	const config = $derived(RESOURCE_CONFIG[resource]);
	const otherResource = $derived(resource === "el" ? "water" : "el");
	const otherConfig = $derived(RESOURCE_CONFIG[otherResource]);
</script>

<nav class="border-b" aria-label="Main navigation">
	<div class="container mx-auto flex items-center gap-1 px-4 py-2">
		<a href={resolve("/")} class="mr-4 flex items-center gap-2 font-semibold">
			{#if resource === "water"}
				<Droplet class="h-5 w-5" />
			{:else}
				<Zap class="h-5 w-5" />
			{/if}
			<span class="hidden sm:inline">{config.label}</span>
		</a>
		{#each config.navLinks as group, i (i)}
			{#if i > 0}
				<div class="mx-1.5 h-5 w-[2px] bg-muted-foreground/40"></div>
			{/if}
			{#each group as link (link.href)}
				<Button
					href={link.href}
					variant={page.url.pathname.startsWith(link.href) ? "secondary" : "ghost"}
					size="sm"
				>
					{link.title}
				</Button>
			{/each}
		{/each}

		<div class="ml-auto flex items-center gap-1.5">
			<Button onclick={toggleMode} variant="ghost" size="icon" class="h-8 w-8">
				<Sun class="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
				<Moon
					class="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
			<form method="POST" action="/resource">
				<input type="hidden" name="resource" value={otherResource} />
				<input type="hidden" name="redirect" value={page.url.pathname + page.url.search} />
				<Button type="submit" variant="outline" size="sm" class="gap-1.5">
					{#if otherResource === "water"}
						<Droplet class="h-3.5 w-3.5" />
					{:else}
						<Zap class="h-3.5 w-3.5" />
					{/if}
					<ArrowLeftRight class="h-3 w-3" />
					{otherConfig.label}
				</Button>
			</form>
		</div>
	</div>
</nav>
