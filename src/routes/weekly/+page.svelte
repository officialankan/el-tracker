<script lang="ts">
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import { Toggle } from "$lib/components/ui/toggle";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import ComparisonSelector from "$lib/components/ComparisonSelector.svelte";
	import { formatDateRange, formatDayOfWeek } from "$lib/utils/date-utils";
	import { ChevronLeft, ChevronRight, Target, TrendingUp } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	let showTarget = $state(true);
	let showCumulative = $state(true);

	const labels = $derived(
		data.weekDates.map((date) => {
			const day = formatDayOfWeek(date);
			const dayNum = new Date(date).getDate();
			return `${day} ${dayNum}`;
		})
	);

	const dateRangeLabel = $derived(formatDateRange(data.weekDates[0], data.weekDates[6]));
	const periodLabel = $derived(`Week ${data.week}, ${data.year}`);
	const basePath = $derived(`/weekly?year=${data.year}&week=${data.week}`);

	const comparisonLabel = $derived(
		data.comparison.isCustom
			? `Week ${data.comparison.week}, ${data.comparison.year}`
			: "Previous Week"
	);

	const hasData = $derived(data.dailyValues.some((v) => v !== null));
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">Weekly Consumption</h1>
			<p class="text-muted-foreground">{dateRangeLabel}</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon"
				href="/weekly?year={data.navigation.prev.year}&week={data.navigation.prev.week}"
			>
				<ChevronLeft class="h-4 w-4" />
			</Button>

			<div class="min-w-[140px] text-center">
				<p class="text-sm font-medium">{periodLabel}</p>
			</div>

			<Button
				variant="outline"
				size="icon"
				href="/weekly?year={data.navigation.next.year}&week={data.navigation.next.week}"
				disabled={data.navigation.isCurrent}
			>
				<ChevronRight class="h-4 w-4" />
			</Button>

			<Button variant="outline" href="/weekly" disabled={data.navigation.isCurrent}>
				Current Week
			</Button>
		</div>
	</div>

	<ComparisonSelector
		mode="weekly"
		{basePath}
		compareYear={data.comparison.year}
		compareWeek={data.comparison.week}
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
					data={data.dailyValues}
					comparisonData={data.comparisonDailyValues}
					{comparisonLabel}
					targetLine={data.target?.value}
					{showTarget}
					{showCumulative}
					yLabel="This Week"
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
					{periodLabel}
					subUnitLabel="day"
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
