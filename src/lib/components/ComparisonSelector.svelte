<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { ArrowLeftRight, X } from "@lucide/svelte";

	interface Props {
		mode: "weekly" | "monthly" | "yearly";
		basePath: string;
		compareYear: number;
		compareWeek?: number;
		compareMonth?: number;
		enabled: boolean;
		comparisonLabel: string;
	}

	let { mode, basePath, compareYear, compareWeek, compareMonth, enabled, comparisonLabel }: Props =
		$props();

	let inputYear = $derived.by(() => compareYear);
	let inputWeek = $derived.by(() => compareWeek ?? 1);
	let inputMonth = $derived.by(() => compareMonth ?? 1);

	const compareHref = $derived.by(() => {
		if (mode === "weekly") {
			return `${basePath}&compare_year=${inputYear}&compare_week=${inputWeek}`;
		} else if (mode === "monthly") {
			return `${basePath}&compare_year=${inputYear}&compare_month=${inputMonth}`;
		} else {
			return `${basePath}&compare=${inputYear}`;
		}
	});
</script>

<div class="flex flex-wrap items-center gap-2">
	{#if enabled}
		<span class="text-sm text-muted-foreground">vs. {comparisonLabel}</span>
		<Button variant="ghost" size="sm" href={basePath}>
			<X class="mr-1 h-3 w-3" />
			Clear
		</Button>
		<div class="ml-2 flex items-center gap-2 border-l border-border pl-2">
			<label class="text-xs text-muted-foreground" for="compare-year">Year</label>
			<input
				id="compare-year"
				type="number"
				bind:value={inputYear}
				class="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
			/>
			{#if mode === "weekly"}
				<label class="text-xs text-muted-foreground" for="compare-week">Week</label>
				<input
					id="compare-week"
					type="number"
					bind:value={inputWeek}
					min="1"
					max="53"
					class="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
				/>
			{:else if mode === "monthly"}
				<label class="text-xs text-muted-foreground" for="compare-month">Month</label>
				<input
					id="compare-month"
					type="number"
					bind:value={inputMonth}
					min="1"
					max="12"
					class="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
				/>
			{/if}
			<Button variant="outline" size="sm" href={compareHref}>Apply</Button>
		</div>
	{:else}
		<Button variant="outline" size="sm" href={compareHref}>
			<ArrowLeftRight class="mr-1 h-3 w-3" />
			Compare...
		</Button>
	{/if}
</div>
