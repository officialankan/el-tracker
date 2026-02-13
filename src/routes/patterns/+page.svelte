<script lang="ts">
	import type { PageData } from "./$types";
	import ConsumptionBarChart from "$lib/components/ConsumptionBarChart.svelte";
	import HeatmapChart from "$lib/components/HeatmapChart.svelte";
	import * as Card from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { TrendingUp } from "@lucide/svelte";

	let { data }: { data: PageData } = $props();

	const monthsOptions = [3, 6, 12];

	const hasData = $derived(
		data.dayOfWeek.values.some((v) => v !== null) ||
			data.monthOfYear.values.some((v) => v !== null) ||
			data.heatmap.length > 0
	);
</script>

<div class="container mx-auto space-y-6 p-6">
	<div>
		<div class="flex items-center gap-2">
			<TrendingUp class="h-6 w-6" />
			<h1 class="text-3xl font-bold">Consumption Patterns</h1>
		</div>
		<p class="text-muted-foreground">Aggregated insights across all your consumption data</p>
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
		<!-- Day-of-week averages -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Average by Day of Week</Card.Title>
				<Card.Description>Average hourly consumption for each day of the week</Card.Description>
			</Card.Header>
			<Card.Content>
				<ConsumptionBarChart
					labels={data.dayOfWeek.labels}
					data={data.dayOfWeek.values}
					yLabel="Avg kWh"
				/>
			</Card.Content>
		</Card.Root>

		<!-- Month-of-year averages -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Average by Month</Card.Title>
				<Card.Description>Average hourly consumption for each month of the year</Card.Description>
			</Card.Header>
			<Card.Content>
				<ConsumptionBarChart
					labels={data.monthOfYear.labels}
					data={data.monthOfYear.values}
					yLabel="Avg kWh"
				/>
			</Card.Content>
		</Card.Root>

		<!-- Calendar heatmap -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title>Daily Consumption Heatmap</Card.Title>
						<Card.Description
							>Daily total consumption over the last {data.months} months</Card.Description
						>
					</div>
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
				</div>
			</Card.Header>
			<Card.Content>
				<HeatmapChart data={data.heatmap} />
			</Card.Content>
		</Card.Root>
	{/if}
</div>
