<script lang="ts">
	import type { PageData } from "./$types";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import HeatmapChart from "$lib/components/HeatmapChart.svelte";
	import * as Card from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
	import { Button } from "$lib/components/ui/button";
	import { TrendingUp } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { RESOURCE_CONFIG } from "$lib/resource";

	let { data }: { data: PageData } = $props();

	const config = $derived(RESOURCE_CONFIG[data.resource]);
	const showDayOfWeek = $derived(data.resource !== "water");

	const monthsOptions = [1, 3, 6, 12];
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];

	const selectClass =
		"rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

	const hasData = $derived(
		data.dayOfWeek.values.some((v) => v !== null) ||
			data.monthOfYear.values.some((v) => v !== null) ||
			data.heatmap.length > 0
	);

	const subtitle = $derived.by(() => {
		if (data.period === "month" && data.year && data.month) {
			return `Patterns for ${monthNames[data.month - 1]} ${data.year}`;
		}
		if (data.period === "year" && data.year) {
			return `Patterns for ${data.year}`;
		}
		return "Aggregated insights across all your consumption data";
	});

	const comparisonLabel = $derived.by(() => {
		if (!data.compare) return "";
		if (data.compare.period === "month" && data.compare.year && data.compare.month) {
			return `${monthNames[data.compare.month - 1]} ${data.compare.year}`;
		}
		if (data.compare.period === "year" && data.compare.year) {
			return String(data.compare.year);
		}
		return "All time";
	});

	function buildUrl(params: Record<string, string>) {
		const sp = new URLSearchParams(params);
		return `/patterns?${sp.toString()}`;
	}

	/** Build current primary params as a record (preserving tab) */
	function primaryParams(): Record<string, string> {
		const params: Record<string, string> = {};
		if (data.tab === "compare") params.tab = "compare";
		if (data.period !== "all") params.period = data.period;
		if (data.year) params.year = String(data.year);
		if (data.month) params.month = String(data.month);
		return params;
	}

	function onTabChange(tab: string) {
		const params: Record<string, string> = {};
		if (tab === "compare") {
			params.tab = "compare";
			// Default comparison to "all" when switching to compare tab
			params.compare_period = "all";
		}
		if (data.period !== "all") params.period = data.period;
		if (data.year) params.year = String(data.year);
		if (data.month) params.month = String(data.month);
		goto(resolve(buildUrl(params)));
	}

	function onPeriodChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		const params: Record<string, string> = {};
		if (data.tab === "compare") {
			params.tab = "compare";
			// Preserve comparison params
			if (data.compare) {
				params.compare_period = data.compare.period;
				if (data.compare.year) params.compare_year = String(data.compare.year);
				if (data.compare.month) params.compare_month = String(data.compare.month);
			} else {
				params.compare_period = "all";
			}
		}
		if (value === "all") {
			goto(resolve(buildUrl(params)));
		} else if (value === "year") {
			const year = data.year ?? data.availableYears[data.availableYears.length - 1];
			goto(resolve(buildUrl({ ...params, period: "year", year: String(year) })));
		} else if (value === "month") {
			const year = data.year ?? data.availableYears[data.availableYears.length - 1];
			const month = data.month ?? new Date().getMonth() + 1;
			goto(
				resolve(buildUrl({ ...params, period: "month", year: String(year), month: String(month) }))
			);
		}
	}

	function onYearChange(e: Event) {
		const year = (e.target as HTMLSelectElement).value;
		const params = primaryParams();
		if (data.compare) {
			params.compare_period = data.compare.period;
			if (data.compare.year) params.compare_year = String(data.compare.year);
			if (data.compare.month) params.compare_month = String(data.compare.month);
		}
		if (data.period === "month" && data.month) {
			goto(resolve(buildUrl({ ...params, period: "month", year, month: String(data.month) })));
		} else {
			goto(resolve(buildUrl({ ...params, period: "year", year })));
		}
	}

	function onMonthChange(e: Event) {
		const month = (e.target as HTMLSelectElement).value;
		const year = data.year ?? data.availableYears[data.availableYears.length - 1];
		const params = primaryParams();
		if (data.compare) {
			params.compare_period = data.compare.period;
			if (data.compare.year) params.compare_year = String(data.compare.year);
			if (data.compare.month) params.compare_month = String(data.compare.month);
		}
		goto(resolve(buildUrl({ ...params, period: "month", year: String(year), month })));
	}

	function onComparePeriodChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		const params = primaryParams();
		if (value === "all") {
			params.compare_period = "all";
		} else if (value === "year") {
			const year = data.compare?.year ?? data.availableYears[data.availableYears.length - 1];
			params.compare_period = "year";
			params.compare_year = String(year);
		} else if (value === "month") {
			const year = data.compare?.year ?? data.availableYears[data.availableYears.length - 1];
			const month = data.compare?.month ?? new Date().getMonth() + 1;
			params.compare_period = "month";
			params.compare_year = String(year);
			params.compare_month = String(month);
		}
		goto(resolve(buildUrl(params)));
	}

	function onCompareYearChange(e: Event) {
		const year = (e.target as HTMLSelectElement).value;
		const params = primaryParams();
		params.compare_period = data.compare!.period;
		params.compare_year = year;
		if (data.compare!.period === "month" && data.compare!.month) {
			params.compare_month = String(data.compare!.month);
		}
		goto(resolve(buildUrl(params)));
	}

	function onCompareMonthChange(e: Event) {
		const month = (e.target as HTMLSelectElement).value;
		const params = primaryParams();
		const year = data.compare?.year ?? data.availableYears[data.availableYears.length - 1];
		params.compare_period = "month";
		params.compare_year = String(year);
		params.compare_month = month;
		goto(resolve(buildUrl(params)));
	}
</script>

{#snippet periodFilter()}
	<div class="flex flex-wrap items-center gap-3">
		<select class={selectClass} value={data.period} onchange={onPeriodChange}>
			<option value="all">All time</option>
			<option value="year">Year</option>
			<option value="month">Month</option>
		</select>

		{#if data.period === "year" || data.period === "month"}
			<select class={selectClass} value={data.year} onchange={onYearChange}>
				{#each data.availableYears as y (y)}
					<option value={y}>{y}</option>
				{/each}
			</select>
		{/if}

		{#if data.period === "month"}
			<select class={selectClass} value={data.month} onchange={onMonthChange}>
				{#each monthNames as name, i (i)}
					<option value={i + 1}>{name}</option>
				{/each}
			</select>
		{/if}
	</div>
{/snippet}

{#snippet comparisonFilter()}
	<div class="flex flex-wrap items-center gap-3">
		<span class="text-sm font-medium text-muted-foreground">vs.</span>

		<select
			class={selectClass}
			value={data.compare?.period ?? "all"}
			onchange={onComparePeriodChange}
		>
			<option value="all">All time</option>
			<option value="year">Year</option>
			<option value="month">Month</option>
		</select>

		{#if data.compare?.period === "year" || data.compare?.period === "month"}
			<select class={selectClass} value={data.compare?.year} onchange={onCompareYearChange}>
				{#each data.availableYears as y (y)}
					<option value={y}>{y}</option>
				{/each}
			</select>
		{/if}

		{#if data.compare?.period === "month"}
			<select class={selectClass} value={data.compare?.month} onchange={onCompareMonthChange}>
				{#each monthNames as name, i (i)}
					<option value={i + 1}>{name}</option>
				{/each}
			</select>
		{/if}
	</div>
{/snippet}

<div class="container mx-auto space-y-6 p-6">
	<div>
		<div class="flex items-center gap-2">
			<TrendingUp class="h-6 w-6" />
			<h1 class="text-3xl font-bold">Consumption Patterns</h1>
		</div>
		<p class="text-muted-foreground">{subtitle}</p>
	</div>

	{#if !hasData}
		<div class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
			<p class="text-lg font-medium text-muted-foreground">No data available</p>
			<p class="mt-1 text-sm text-muted-foreground">
				<Button variant="link" href="/import" class="h-auto p-0">Import data</Button> to see consumption
				patterns.
			</p>
		</div>
	{:else}
		<Tabs.Root value={data.tab} onValueChange={onTabChange}>
			<Tabs.List>
				<Tabs.Trigger value="patterns">Patterns</Tabs.Trigger>
				<Tabs.Trigger value="compare">Compare</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="patterns" class="space-y-6 pt-4">
				{@render periodFilter()}

				{#if showDayOfWeek}
					<Card.Root>
						<Card.Header>
							<Card.Title>Average by Day of Week</Card.Title>
							<Card.Description
								>Average hourly consumption for each day of the week</Card.Description
							>
						</Card.Header>
						<Card.Content>
							<ConsumptionBarChart
								labels={data.dayOfWeek.labels}
								data={data.dayOfWeek.values}
								yLabel="Avg {config.unit}"
							/>
						</Card.Content>
					</Card.Root>
				{/if}

				{#if data.period !== "month"}
					<Card.Root>
						<Card.Header>
							<Card.Title>Average by Month</Card.Title>
							<Card.Description
								>Average hourly consumption for each month of the year</Card.Description
							>
						</Card.Header>
						<Card.Content>
							<ConsumptionBarChart
								labels={data.monthOfYear.labels}
								data={data.monthOfYear.values}
								yLabel="Avg {config.unit}"
							/>
						</Card.Content>
					</Card.Root>
				{/if}

				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div>
								<Card.Title>Daily Consumption Heatmap</Card.Title>
								<Card.Description>
									{#if data.period === "all"}
										Daily total consumption over the last {data.months} months
									{:else if data.period === "year"}
										Daily total consumption for {data.year}
									{:else}
										Daily total consumption for {monthNames[(data.month ?? 1) - 1]} {data.year}
									{/if}
								</Card.Description>
							</div>
							{#if data.period === "all"}
								<div class="flex gap-1">
									{#each monthsOptions as m (m)}
										<Button
											variant={data.months === m ? "secondary" : "ghost"}
											size="sm"
											href="/patterns?months={m}"
											data-sveltekit-noscroll
										>
											{m}mo
										</Button>
									{/each}
								</div>
							{/if}
						</div>
					</Card.Header>
					<Card.Content>
						<HeatmapChart data={data.heatmap} unit={config.unit} />
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="compare" class="space-y-6 pt-4">
				{@render periodFilter()}
				{@render comparisonFilter()}

				{#if showDayOfWeek}
					<Card.Root>
						<Card.Header>
							<Card.Title>Average by Day of Week</Card.Title>
							<Card.Description
								>Average hourly consumption for each day of the week</Card.Description
							>
						</Card.Header>
						<Card.Content>
							<ConsumptionBarChart
								labels={data.dayOfWeek.labels}
								data={data.dayOfWeek.values}
								yLabel="Avg {config.unit}"
								comparisonData={data.comparisonDayOfWeek ?? undefined}
								comparisonLabel={comparisonLabel || undefined}
							/>
						</Card.Content>
					</Card.Root>
				{/if}

				{#if data.period !== "month"}
					<Card.Root>
						<Card.Header>
							<Card.Title>Average by Month</Card.Title>
							<Card.Description
								>Average hourly consumption for each month of the year</Card.Description
							>
						</Card.Header>
						<Card.Content>
							<ConsumptionBarChart
								labels={data.monthOfYear.labels}
								data={data.monthOfYear.values}
								yLabel="Avg {config.unit}"
								comparisonData={data.comparisonMonthOfYear ?? undefined}
								comparisonLabel={comparisonLabel || undefined}
							/>
						</Card.Content>
					</Card.Root>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	{/if}
</div>
