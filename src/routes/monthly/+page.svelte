<script lang="ts">
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import ComparisonSelector from "$lib/components/ComparisonSelector.svelte";
	import { formatMonthLabel } from "$lib/utils/date-utils";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

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
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex items-center justify-between">
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

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="lg:col-span-2">
			<ConsumptionBarChart
				{labels}
				data={paddedData}
				comparisonData={paddedComparison}
				{comparisonLabel}
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
				projection={data.stats.projection}
				{periodLabel}
				subUnitLabel="day"
			/>
		</div>
	</div>
</div>
