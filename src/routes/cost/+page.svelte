<script lang="ts">
	import type { PageData } from "./$types";
	import { page } from "$app/state";
	import * as Card from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import StatsCard from "$lib/components/StatsCard.svelte";
	import { formatMonthLabel } from "$lib/utils/date-utils";
	import { formatValue } from "$lib/utils/format";
	import { RESOURCE_CONFIG, type ResourceType } from "$lib/resource";

	let { data }: { data: PageData } = $props();

	const resource = $derived(page.data.resource as ResourceType);
	const unit = $derived(RESOURCE_CONFIG[resource].unit);
	const priceUnitLabel = $derived(`öre/${unit}`);

	let priceOre = $state<number | undefined>(undefined);

	const pricePerUnit = $derived(priceOre !== undefined ? priceOre / 100 : null);

	function fmtSek(value: number): string {
		return formatValue(value, "SEK", 2);
	}

	const currentCost = $derived(pricePerUnit !== null ? data.stats.total * pricePerUnit : null);
	const projectedCost = $derived(
		pricePerUnit !== null && data.stats.projection !== null
			? data.stats.projection * pricePerUnit
			: null
	);
	const dailyAvgCost = $derived(pricePerUnit !== null ? data.stats.average * pricePerUnit : null);
	const targetCost = $derived(
		pricePerUnit !== null && data.target ? data.target.value * pricePerUnit : null
	);

	const periodLabel = $derived(formatMonthLabel(data.year, data.month));
</script>

<div class="mx-auto max-w-4xl space-y-6 p-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Cost Estimator</h1>
		<p class="text-muted-foreground">{periodLabel}</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Pris per {unit}</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="max-w-xs">
				<Label for="price-input">{priceUnitLabel}</Label>
				<Input
					id="price-input"
					type="number"
					placeholder="t.ex. 85"
					bind:value={priceOre}
					min={0}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	{#if currentCost !== null}
		<Card.Root>
			<Card.Header>
				<Card.Title>Kostnadsberäkning</Card.Title>
				<Card.Description>Baserat på {priceOre} {priceUnitLabel}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<p class="text-sm text-muted-foreground">Nuvarande kostnad</p>
						<p class="text-2xl font-bold">{fmtSek(currentCost)}</p>
						<p class="text-xs text-muted-foreground">
							{data.stats.daysWithData} av {data.stats.totalDaysInMonth} dagar
						</p>
					</div>

					{#if projectedCost !== null}
						<div>
							<p class="text-sm text-muted-foreground">Beräknad månadskostnad</p>
							<p class="text-2xl font-bold">{fmtSek(projectedCost)}</p>
						</div>
					{/if}

					{#if dailyAvgCost !== null}
						<div>
							<p class="text-sm text-muted-foreground">Genomsnittlig dagskostnad</p>
							<p class="text-2xl font-bold">{fmtSek(dailyAvgCost)}</p>
						</div>
					{/if}

					{#if targetCost !== null}
						<div>
							<p class="text-sm text-muted-foreground">Målkostnad</p>
							<p class="text-2xl font-bold">{fmtSek(targetCost)}</p>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<StatsCard
		total={data.stats.total}
		average={data.stats.average}
		projection={data.stats.projection}
		target={data.target}
		{periodLabel}
		subUnitLabel="dag"
		{unit}
	/>
</div>
