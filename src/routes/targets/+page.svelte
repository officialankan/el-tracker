<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import * as Select from "$lib/components/ui/select";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Separator } from "$lib/components/ui/separator";
	import { Target, Trash2 } from "@lucide/svelte";
	import type { ActionData, PageData } from "./$types";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type PeriodType = "daily" | "weekly" | "monthly" | "yearly";
	const periodTypes: PeriodType[] = ["daily", "weekly", "monthly", "yearly"];

	let selectedPeriodType = $state("daily");
	let todayStr = new Date().toISOString().split("T")[0];

	const periodLabels: Record<string, string> = {
		daily: "Dagligt",
		weekly: "Vecka",
		monthly: "Månad",
		yearly: "År"
	};

	function formatKwh(value: number): string {
		return value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
	}
</script>

<div class="container mx-auto max-w-4xl space-y-8 p-6">
	<div class="flex items-center gap-3">
		<Target class="h-8 w-8" />
		<h1 class="text-3xl font-bold">Consumption Targets</h1>
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<p class="text-sm text-red-700">{form.error}</p>
		</div>
	{/if}

	<!-- Active Targets -->
	<section>
		<h2 class="mb-4 text-xl font-semibold">Active Targets</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each periodTypes as period (period)}
				{@const target = data.activeTargets[period]}
				<Card.Root>
					<Card.Header class="pb-2">
						<Card.Title class="text-sm font-medium text-muted-foreground">
							{periodLabels[period]}
						</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if target}
							<p class="text-2xl font-bold">{formatKwh(target.kwhTarget)} kWh</p>
							<p class="text-sm text-muted-foreground">
								Giltig från {target.validFrom}
							</p>
						{:else}
							<p class="text-muted-foreground">No target set</p>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<Separator />

	<!-- Set New Target -->
	<section>
		<h2 class="mb-4 text-xl font-semibold">Set New Target</h2>
		<Card.Root>
			<Card.Content class="pt-6">
				<form method="POST" action="?/create" use:enhance class="grid gap-4 sm:grid-cols-4">
					<input type="hidden" name="periodType" value={selectedPeriodType} />

					<div class="space-y-2">
						<Label for="period-select">Period Type</Label>
						<Select.Root type="single" bind:value={selectedPeriodType}>
							<Select.Trigger id="period-select" class="w-full">
								{periodLabels[selectedPeriodType]}
							</Select.Trigger>
							<Select.Content>
								{#each Object.entries(periodLabels) as [value, label] (value)}
									<Select.Item {value} {label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label for="kwh-target">Target (kWh)</Label>
						<Input
							id="kwh-target"
							name="kwhTarget"
							type="number"
							step="0.1"
							min="0.1"
							placeholder="e.g. 100"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="valid-from">Valid From</Label>
						<Input id="valid-from" name="validFrom" type="date" value={todayStr} required />
					</div>

					<div class="flex items-end">
						<Button type="submit" class="w-full">Save Target</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</section>

	<Separator />

	<!-- Target History -->
	<section>
		<h2 class="mb-4 text-xl font-semibold">Target History</h2>
		{#if data.allTargets.length === 0}
			<p class="text-muted-foreground">No targets have been set yet.</p>
		{:else}
			<Card.Root>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Period Type</Table.Head>
							<Table.Head>Target (kWh)</Table.Head>
							<Table.Head>Valid From</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.allTargets as target (target.id)}
							{@const isActive =
								data.activeTargets[target.periodType as PeriodType]?.id === target.id}
							<Table.Row>
								<Table.Cell>{periodLabels[target.periodType]}</Table.Cell>
								<Table.Cell>{formatKwh(target.kwhTarget)}</Table.Cell>
								<Table.Cell>{target.validFrom}</Table.Cell>
								<Table.Cell>
									{#if isActive}
										<span
											class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
										>
											Active
										</span>
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
										>
											Inactive
										</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									<form method="POST" action="?/delete" use:enhance class="inline">
										<input type="hidden" name="id" value={target.id} />
										<Button variant="ghost" size="icon-sm" type="submit">
											<Trash2 class="h-4 w-4 text-destructive" />
										</Button>
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Root>
		{/if}
	</section>
</div>
