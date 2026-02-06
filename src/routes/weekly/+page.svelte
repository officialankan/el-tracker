<script lang="ts">
	import type { PageData } from "./$types";
	import { Button } from "$lib/components/ui/button";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import { formatDateRange, formatDayOfWeek } from "$lib/utils/date-utils";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	const labels = $derived(
		data.weekDates.map((date, i) => {
			const day = formatDayOfWeek(date);
			const dayNum = new Date(date).getDate();
			return `${day} ${dayNum}`;
		})
	);

	const dateRangeLabel = $derived(formatDateRange(data.weekDates[0], data.weekDates[6]));
	const periodLabel = $derived(`Week ${data.week}, ${data.year}`);
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex items-center justify-between">
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

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="lg:col-span-2">
			<ConsumptionBarChart
				{labels}
				data={data.dailyValues}
				comparisonData={data.prevDailyValues}
				comparisonLabel="Previous Week"
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
				{periodLabel}
				subUnitLabel="day"
			/>
		</div>
	</div>
</div>
