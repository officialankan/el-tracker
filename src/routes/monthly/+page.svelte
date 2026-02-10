<script lang="ts">
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import { formatMonthLabel } from "$lib/utils/date-utils";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	const labels = $derived(data.monthDates.map((_, i) => String(i + 1)));

	const periodLabel = $derived(formatMonthLabel(data.year, data.month));
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

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="lg:col-span-2">
			<ConsumptionBarChart
				{labels}
				data={data.dailyValues}
				comparisonData={data.prevDailyValues}
				comparisonLabel="Previous Month"
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
