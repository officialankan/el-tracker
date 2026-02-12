<script lang="ts">
	import { browser } from "$app/environment";
	import { Chart, Layer, Axis, Bars, Highlight, Tooltip, Area } from "layerchart";
	import TargetLine from "./TargetLine.svelte";
	import { scaleBand } from "d3-scale";

	interface Props {
		labels: string[];
		data: (number | null)[];
		comparisonData?: (number | null)[];
		comparisonLabel?: string;
		targetLine?: number;
		showTarget?: boolean;
		showCumulative?: boolean;
		xLabel?: string;
		yLabel?: string;
	}

	let {
		labels,
		data,
		comparisonData,
		comparisonLabel,
		targetLine,
		showTarget = true,
		showCumulative = true,
		xLabel,
		yLabel
	}: Props = $props();

	// Transform data into layerchart format (with cumulative for target overlay)
	const chartData = $derived.by(() => {
		let cumSum = 0;
		return labels.map((label, i) => {
			const value = data[i] ?? null;
			if (value != null) {
				cumSum += value;
			}
			return {
				label,
				value,
				comparison: comparisonData?.[i] ?? null,
				cumulative: targetLine != null && showCumulative && value != null ? cumSum : null
			};
		});
	});

	const cumulativeTotal = $derived(data.reduce((sum: number, v) => sum + (v ?? 0), 0));

	const maxValue = $derived(
		Math.max(
			...data.filter((v) => v !== null),
			...(comparisonData?.filter((v) => v !== null) ?? []),
			targetLine && showTarget ? targetLine : 0,
			targetLine && showCumulative ? cumulativeTotal : 0
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
					grid={{ style: "stroke: var(--border); stroke-dasharray: 2" }}
					rule
				/>
				<Axis placement="bottom" rule />
				{#if targetLine && showCumulative}
					<Area y1="cumulative" class="fill-primary/10 stroke-primary/40" />
				{/if}
				{#if targetLine && showTarget}
					<TargetLine value={targetLine} />
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
					<!-- Single dataset -->
					<Bars y="value" radius={4} strokeWidth={1} class="fill-(--color-chart-1)" />
				{/if}
				<Highlight area />
			</Layer>
			<Tooltip.Root>
				{#snippet children({ data: d })}
					<Tooltip.Header>{d.label}</Tooltip.Header>
					<Tooltip.List>
						<Tooltip.Item
							label={yLabel ?? "Consumption"}
							value={d.value != null ? Math.round(d.value) : d.value}
						/>
						{#if d.comparison !== null && comparisonData}
							<Tooltip.Item
								label={comparisonLabel ?? "Comparison"}
								value={d.comparison != null ? Math.round(d.comparison) : d.comparison}
							/>
						{/if}
						{#if d.cumulative != null}
							<Tooltip.Item label="Cumulative" value={Math.round(d.cumulative)} />
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
