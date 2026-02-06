<script lang="ts">
	import { browser } from "$app/environment";
	import { Chart, Layer, Axis, Bars, Highlight, Tooltip } from "layerchart";
	import { scaleBand } from "d3-scale";

	interface Props {
		labels: string[];
		data: number[];
		comparisonData?: number[];
		comparisonLabel?: string;
		targetLine?: number;
		xLabel?: string;
		yLabel?: string;
	}

	let { labels, data, comparisonData, comparisonLabel, targetLine, xLabel, yLabel }: Props =
		$props();

	// Transform data into layerchart format
	const chartData = $derived(
		labels.map((label, i) => ({
			label,
			value: data[i] ?? null,
			comparison: comparisonData?.[i] ?? null
		}))
	);

	const maxValue = $derived(
		Math.max(
			...data.filter((v) => v !== null),
			...(comparisonData?.filter((v) => v !== null) ?? []),
			targetLine ?? 0
		) * 1.1
	);
</script>

{#if browser}
	<div class="h-[400px] w-full">
		<Chart
			data={chartData}
			x="label"
			xScale={scaleBand().padding(0.4)}
			y={comparisonData ? ["comparison", "value"] : "value"}
			yDomain={[0, maxValue]}
			yNice
			padding={{ left: 60, bottom: 40, top: 20, right: 20 }}
			tooltip={{ mode: "band" }}
		>
			<Layer type="svg">
				<Axis
					placement="left"
					grid={{ style: "stroke: hsl(var(--border)); stroke-dasharray: 2" }}
					rule
				/>
				<Axis placement="bottom" rule />
				{#if targetLine}
					<line
						x1="0"
						x2="100%"
						y1={targetLine}
						y2={targetLine}
						stroke="hsl(var(--muted-foreground))"
						stroke-width="2"
						stroke-dasharray="4"
					/>
				{/if}
				{#if comparisonData}
					<!-- Comparison data (previous week) - muted background bars -->
					<Bars y="comparison" radius={4} strokeWidth={1} class="fill-muted" />
					<!-- Current week data - prominent foreground bars with insets -->
					<Bars
						y="value"
						radius={4}
						strokeWidth={1}
						insets={{ x: 4 }}
						class="fill-(--color-chart-1)"
					/>
				{:else}
					<!-- Single dataset - no comparison -->
					<Bars radius={4} strokeWidth={1} class="fill-(--color-chart-1)" />
				{/if}
				<Highlight area />
			</Layer>
			<Tooltip.Root>
				{#snippet children({ data })}
					<Tooltip.Header>{data.label}</Tooltip.Header>
					<Tooltip.List>
						<Tooltip.Item label={yLabel ?? "Consumption"} value={data.value} />
						{#if data.comparison !== null && comparisonData}
							<Tooltip.Item label={comparisonLabel ?? "Comparison"} value={data.comparison} />
						{/if}
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		</Chart>
	</div>

	{#if xLabel}
		<p class="mt-2 text-center text-sm text-muted-foreground">{xLabel}</p>
	{/if}
{:else}
	<div class="flex h-[400px] w-full items-center justify-center bg-muted/20">
		<p class="text-sm text-muted-foreground">Loading chart...</p>
	</div>
{/if}
