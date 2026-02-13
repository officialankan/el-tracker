<script lang="ts">
	import type { PageData } from "./$types";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Toggle } from "$lib/components/ui/toggle";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import ComparisonSelector from "$lib/components/ComparisonSelector.svelte";
	import { formatMonthLabel } from "$lib/utils/date-utils";
	import { RESOURCE_CONFIG, type ResourceType } from "$lib/resource";
	import { ChevronLeft, ChevronRight, Target, TrendingUp } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	const resource = $derived(page.data.resource as ResourceType);
	const unit = $derived(RESOURCE_CONFIG[resource].unit);

	let showTarget = $state(true);
	let showCumulative = $state(true);

	const maxDays = $derived(Math.max(data.monthDates.length, data.comparisonDailyValues.length));
	const labels = $derived(Array.from({ length: maxDays }, (_, i) => String(i + 1)));
	const paddedData = $derived([
		...data.dailyValues,
		...Array<null>(maxDays - data.dailyValues.length).fill(null)
	]);
	const paddedComparison = $derived([
		...data.comparisonDailyValues,
		...Array<null>(maxDays - data.comparisonDailyValues.length).fill(null)
	]);

	const periodLabel = $derived(formatMonthLabel(data.year, data.month));
	const basePath = $derived(`/monthly?year=${data.year}&month=${data.month}`);

	const comparisonLabel = $derived(
		data.comparison.isCustom
			? formatMonthLabel(data.comparison.year, data.comparison.month)
			: "Previous Month"
	);

	const hasData = $derived(data.dailyValues.some((v) => v !== null));
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">Monthly Consumption</h1>
			<p class="text-muted-foreground">{periodLabel}</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon"
				href="/monthly?year={data.navigation.prev.year}&month={data.navigation.prev.month}"
			>
				<ChevronLeft class="h-4 w-4" />
			</Button>

			<div class="min-w-[160px] text-center">
				<p class="text-sm font-medium">{periodLabel}</p>
			</div>

			<Button
				variant="outline"
				size="icon"
				href="/monthly?year={data.navigation.next.year}&month={data.navigation.next.month}"
				disabled={data.navigation.isCurrent}
			>
				<ChevronRight class="h-4 w-4" />
			</Button>

			<Button variant="outline" href="/monthly" disabled={data.navigation.isCurrent}>
				Current Month
			</Button>
		</div>
	</div>

	<ComparisonSelector
		mode="monthly"
		{basePath}
		compareYear={data.comparison.year}
		compareMonth={data.comparison.month}
		enabled={data.comparison.isCustom}
		{comparisonLabel}
	/>

	{#if hasData}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="lg:col-span-2">
				{#if data.target}
					<div class="mb-2 flex items-center gap-1">
						<Toggle variant="outline" size="sm" bind:pressed={showTarget}>
							<Target class="h-4 w-4" />
							Target
						</Toggle>
						<Toggle variant="outline" size="sm" bind:pressed={showCumulative}>
							<TrendingUp class="h-4 w-4" />
							Cumulative
						</Toggle>
					</div>
				{/if}
				<ConsumptionBarChart
					{labels}
					data={paddedData}
					comparisonData={paddedComparison}
					{comparisonLabel}
					targetLine={data.target?.value}
					{showTarget}
					{showCumulative}
					yLabel="This Month"
				/>
			</div>

			<div class="lg:col-span-2">
				<StatsCard
					total={data.stats.total}
					average={data.stats.average}
					peakDay={data.stats.peakDay}
					rollingAverage={data.stats.rollingAverage}
					previousTotal={data.stats.previousTotal}
					percentChange={data.stats.percentChange}
					target={showTarget ? data.target : null}
					projection={data.stats.projection}
					{periodLabel}
					subUnitLabel="day"
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
