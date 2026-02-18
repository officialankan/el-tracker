<script lang="ts">
	import type { PageData } from "./$types";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Toggle } from "$lib/components/ui/toggle";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import ComparisonSelector from "$lib/components/ComparisonSelector.svelte";
	import { formatShortMonth } from "$lib/utils/date-utils";
	import { RESOURCE_CONFIG, type ResourceType } from "$lib/resource";
	import { ChevronLeft, ChevronRight, Target, TrendingUp } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	const resource = $derived(page.data.resource as ResourceType);
	const unit = $derived(RESOURCE_CONFIG[resource].unit);

	let showTarget = $state(true);
	let showCumulative = $state(true);

	const labels = $derived(Array.from({ length: 12 }, (_, i) => formatShortMonth(i + 1)));

	const periodLabel = $derived(String(data.year));
	const basePath = $derived(`/yearly?year=${data.year}`);

	const comparisonLabel = $derived(
		data.comparison.isCustom ? String(data.comparison.year) : "Previous Year"
	);

	const hasData = $derived(data.monthlyTotals.some((v) => v !== null));
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">Yearly Consumption</h1>
			<p class="text-muted-foreground">{periodLabel}</p>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="outline" size="icon" href="/yearly?year={data.navigation.prev}">
				<ChevronLeft class="h-4 w-4" />
			</Button>

			<div class="min-w-[160px] text-center">
				<p class="text-sm font-medium">{periodLabel}</p>
			</div>

			<Button
				variant="outline"
				size="icon"
				href="/yearly?year={data.navigation.next}"
				disabled={data.navigation.isCurrent}
			>
				<ChevronRight class="h-4 w-4" />
			</Button>

			<Button variant="outline" href="/yearly" disabled={data.navigation.isCurrent}>
				Current Year
			</Button>
		</div>
	</div>

	<ComparisonSelector
		mode="yearly"
		{basePath}
		compareYear={data.comparison.year}
		enabled={data.comparison.isCustom}
		{comparisonLabel}
	/>

	{#if hasData}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="lg:col-span-2">
				{#if data.target || resource === "water"}
					<div class="mb-2 flex items-center gap-1">
						{#if data.target}
							<Toggle variant="outline" size="sm" bind:pressed={showTarget}>
								<Target class="h-4 w-4" />
								Target
							</Toggle>
						{/if}
						<Toggle variant="outline" size="sm" bind:pressed={showCumulative}>
							<TrendingUp class="h-4 w-4" />
							Cumulative
						</Toggle>
					</div>
				{/if}
				<ConsumptionBarChart
					{labels}
					data={data.monthlyTotals}
					comparisonData={data.comparisonMonthlyTotals}
					{comparisonLabel}
					targetLine={data.target?.value}
					{showTarget}
					{showCumulative}
					alwaysCumulative={resource === "water"}
					yLabel="This Year"
				/>
			</div>

			<div class="lg:col-span-2">
				<StatsCard
					total={data.stats.total}
					average={data.stats.average}
					peakDay={data.stats.peakDay}
					rollingAverage={data.stats.rollingAverage}
					rollingAverageDescription="The average total consumption over the previous 3 years (excluding the current year)."
					previousTotal={data.stats.previousTotal}
					percentChange={data.stats.percentChange}
					target={showTarget ? data.target : null}
					projection={data.stats.projection}
					{periodLabel}
					subUnitLabel="month"
					{unit}
				/>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
			<p class="text-lg font-medium text-muted-foreground">No data for this period</p>
			<p class="mt-1 text-sm text-muted-foreground">
				<Button variant="link" href="/import" class="h-auto p-0">Import data</Button> to see consumption
				charts.
			</p>
		</div>
	{/if}
</div>
