<script lang="ts">
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import ComparisonSelector from "$lib/components/ComparisonSelector.svelte";
	import { formatShortMonth } from "$lib/utils/date-utils";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	const labels = $derived(Array.from({ length: 12 }, (_, i) => formatShortMonth(i + 1)));

	const periodLabel = $derived(String(data.year));
	const basePath = $derived(`/yearly?year=${data.year}`);

	const comparisonLabel = $derived(
		data.comparison.isCustom ? String(data.comparison.year) : "Previous Year"
	);
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex items-center justify-between">
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

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="lg:col-span-2">
			<ConsumptionBarChart
				{labels}
				data={data.monthlyTotals}
				comparisonData={data.comparisonMonthlyTotals}
				{comparisonLabel}
				targetLine={data.target?.value}
				yLabel="This Year"
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
				target={data.target}
				projection={data.stats.projection}
				{periodLabel}
				subUnitLabel="month"
			/>
		</div>
	</div>
</div>
