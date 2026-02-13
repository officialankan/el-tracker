<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { formatValue, formatPercent } from "$lib/utils/format";

	interface Props {
		total: number;
		average: number;
		peakDay?: { index: number; value: number };
		rollingAverage?: number;
		previousTotal?: number;
		percentChange?: number;
		target?: { value: number; validFrom: string } | null;
		projection?: number | null;
		periodLabel: string;
		subUnitLabel: string;
		unit?: string;
	}

	let {
		total,
		average,
		peakDay,
		rollingAverage,
		previousTotal,
		percentChange,
		target,
		projection,
		periodLabel,
		subUnitLabel,
		unit = "kWh"
	}: Props = $props();

	const changeColor = $derived(
		percentChange && percentChange > 0 ? "text-red-600" : "text-green-600"
	);
	const targetColor = $derived(
		target && total > target.value ? "text-red-600" : target ? "text-green-600" : ""
	);

	function fmt(value: number): string {
		return formatValue(value, unit);
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{periodLabel}</Card.Title>
		<Card.Description>Consumption statistics</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<p class="text-sm text-muted-foreground">Total</p>
				<p class="text-2xl font-bold">{fmt(total)}</p>
			</div>

			<div>
				<p class="text-sm text-muted-foreground">Average per {subUnitLabel}</p>
				<p class="text-2xl font-bold">{fmt(average)}</p>
			</div>

			{#if peakDay}
				<div>
					<p class="text-sm text-muted-foreground">Peak {subUnitLabel}</p>
					<p class="text-2xl font-bold">{fmt(peakDay.value)}</p>
				</div>
			{/if}

			{#if rollingAverage !== undefined && rollingAverage > 0}
				<div>
					<p class="text-sm text-muted-foreground">vs. Rolling Average</p>
					<p class="text-2xl font-bold">
						{fmt(total - rollingAverage)}
						<span class="text-sm {total > rollingAverage ? 'text-red-600' : 'text-green-600'}">
							({formatPercent(((total - rollingAverage) / rollingAverage) * 100)})
						</span>
					</p>
				</div>
			{/if}

			{#if previousTotal !== undefined && percentChange !== undefined}
				<div>
					<p class="text-sm text-muted-foreground">vs. Previous Period</p>
					<p class="text-2xl font-bold">
						{fmt(total - previousTotal)}
						<span class="text-sm {changeColor}">
							({formatPercent(percentChange)})
						</span>
					</p>
				</div>
			{/if}

			{#if target}
				<div>
					<p class="text-sm text-muted-foreground">vs. Target</p>
					<p class="text-2xl font-bold">
						{fmt(total - target.value)}
						<span class="text-sm {targetColor}">
							({formatPercent(((total - target.value) / target.value) * 100)})
						</span>
					</p>
				</div>
			{/if}

			{#if projection}
				<div>
					<p class="text-sm text-muted-foreground">Projection</p>
					<p class="text-2xl font-bold">{fmt(projection)}</p>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
