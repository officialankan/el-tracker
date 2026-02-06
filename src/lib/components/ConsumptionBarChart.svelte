<script lang="ts">
	import { Chart, Svg, Axis, Bars, Tooltip } from "layerchart";

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
			value: data[i] ?? 0,
			comparison: comparisonData?.[i] ?? null
		}))
	);

	const maxValue = $derived(
		Math.max(...data, ...(comparisonData ?? []), targetLine ?? 0) * 1.1
	);
</script>

<div class="h-[400px] w-full">
	<Chart
		data={chartData}
		x="label"
		y={{ value: "value", domain: [0, maxValue] }}
		padding={{ left: 60, bottom: 40, top: 20, right: 20 }}
	>
		<Svg>
			<Axis placement="left" grid={{ style: "stroke: hsl(var(--border)); stroke-dasharray: 2" }} />
			<Axis placement="bottom" />
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
			<Bars radius={4} strokeWidth={1} class="fill-primary" />
		</Svg>
		<Tooltip header={(data) => data.label} let:data>
			<div class="space-y-1">
				<div class="flex items-center justify-between gap-4">
					<span class="text-sm text-muted-foreground">{yLabel ?? "Consumption"}</span>
					<span class="font-semibold">{data.value.toFixed(2)} kWh</span>
				</div>
				{#if data.comparison !== null}
					<div class="flex items-center justify-between gap-4 border-t pt-1">
						<span class="text-sm text-muted-foreground">{comparisonLabel ?? "Comparison"}</span>
						<span class="font-semibold">{data.comparison.toFixed(2)} kWh</span>
					</div>
				{/if}
			</div>
		</Tooltip>
	</Chart>
</div>

{#if xLabel}
	<p class="mt-2 text-center text-sm text-muted-foreground">{xLabel}</p>
{/if}
