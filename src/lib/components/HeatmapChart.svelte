<script lang="ts">
	import { browser } from "$app/environment";
	import { SvelteDate, SvelteMap } from "svelte/reactivity";

	interface Props {
		data: { date: string; kwh: number }[];
	}

	let { data }: Props = $props();

	const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

	// Build the grid: figure out week columns from date range
	const grid = $derived.by(() => {
		if (data.length === 0) return { cells: [], weekCount: 0, monthMarkers: [] };

		const dataMap = new SvelteMap<string, number>();
		data.forEach((d) => dataMap.set(d.date, d.kwh));

		// Find the date range
		const sortedDates = data.map((d) => d.date).sort();
		const startDate = new SvelteDate(sortedDates[0]);
		const endDate = new SvelteDate(sortedDates[sortedDates.length - 1]);

		// Adjust start to the Monday of its week
		const startDow = startDate.getDay(); // 0=Sun
		const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
		startDate.setDate(startDate.getDate() + mondayOffset);

		// Adjust end to the Sunday of its week
		const endDow = endDate.getDay();
		if (endDow !== 0) {
			endDate.setDate(endDate.getDate() + (7 - endDow));
		}

		// Calculate color thresholds from data
		const values = data.map((d) => d.kwh).sort((a, b) => a - b);
		const p20 = values[Math.floor(values.length * 0.2)] ?? 0;
		const p40 = values[Math.floor(values.length * 0.4)] ?? 0;
		const p60 = values[Math.floor(values.length * 0.6)] ?? 0;
		const p80 = values[Math.floor(values.length * 0.8)] ?? 0;

		const cells: {
			date: string;
			kwh: number | null;
			level: number;
			row: number;
			col: number;
		}[] = [];
		const monthMarkers: { label: string; col: number }[] = [];
		let lastMonth = -1;

		const current = new SvelteDate(startDate);
		let col = 0;

		while (current <= endDate) {
			// Check for new month marker at start of each week (Monday)
			const month = current.getMonth();
			if (month !== lastMonth) {
				const monthNames = [
					"Jan",
					"Feb",
					"Mar",
					"Apr",
					"May",
					"Jun",
					"Jul",
					"Aug",
					"Sep",
					"Oct",
					"Nov",
					"Dec"
				];
				monthMarkers.push({ label: monthNames[month], col });
				lastMonth = month;
			}

			// Add 7 days for this week column
			for (let row = 0; row < 7; row++) {
				const dateStr = current.toISOString().split("T")[0];
				const kwh = dataMap.get(dateStr) ?? null;
				let level = 0;
				if (kwh !== null) {
					if (kwh <= p20) level = 1;
					else if (kwh <= p40) level = 2;
					else if (kwh <= p60) level = 3;
					else if (kwh <= p80) level = 4;
					else level = 5;
				}
				cells.push({ date: dateStr, kwh, level, row, col });
				current.setDate(current.getDate() + 1);
			}
			col++;
		}

		return { cells, weekCount: col, monthMarkers };
	});

	let hoveredCell: { date: string; kwh: number } | null = $state(null);
	let tooltipPos = $state({ x: 0, y: 0 });

	function handleMouseEnter(e: MouseEvent, cell: { date: string; kwh: number | null }) {
		if (cell.kwh === null) return;
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		tooltipPos = { x: rect.left + rect.width / 2, y: rect.top - 8 };
		hoveredCell = { date: cell.date, kwh: cell.kwh };
	}

	function handleMouseLeave() {
		hoveredCell = null;
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString("sv-SE", { weekday: "short", month: "short", day: "numeric" });
	}
</script>

{#if browser}
	<div>
		<div class="inline-flex gap-1">
			<!-- Day labels column -->
			<div class="flex flex-col pt-6" style:gap="2px">
				{#each dayLabels as label, i (i)}
					<div class="flex w-8 items-center text-xs text-muted-foreground" style:height="14px">
						{label}
					</div>
				{/each}
			</div>

			<!-- Grid -->
			<div>
				<!-- Month labels -->
				<div class="relative mb-1 h-4" style:width="{grid.weekCount * 16}px">
					{#each grid.monthMarkers as marker (marker.col)}
						<span
							class="absolute text-xs text-muted-foreground"
							style:left="{marker.col * 16}px"
							style:min-width="28px"
						>
							{marker.label}
						</span>
					{/each}
				</div>

				<!-- Cells -->
				<div
					class="grid"
					style:gap="2px"
					style:grid-template-columns="repeat({grid.weekCount}, 14px)"
					style:grid-template-rows="repeat(7, 14px)"
				>
					{#each grid.cells as cell (cell.date)}
						<div
							class="heatmap-cell rounded-sm"
							class:level-0={cell.level === 0}
							class:level-1={cell.level === 1}
							class:level-2={cell.level === 2}
							class:level-3={cell.level === 3}
							class:level-4={cell.level === 4}
							class:level-5={cell.level === 5}
							style:grid-row={cell.row + 1}
							style:grid-column={cell.col + 1}
							role="gridcell"
							tabindex="-1"
							aria-label="{cell.date}: {cell.kwh !== null
								? `${Math.round(cell.kwh)} kWh`
								: 'no data'}"
							onmouseenter={(e) => handleMouseEnter(e, cell)}
							onmouseleave={handleMouseLeave}
						></div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Tooltip -->
	{#if hoveredCell}
		<div
			class="fixed z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
			style:left="{tooltipPos.x}px"
			style:top="{tooltipPos.y}px"
			style:transform="translate(-50%, -100%)"
		>
			<p class="font-medium">{formatDate(hoveredCell.date)}</p>
			<p>{Math.round(hoveredCell.kwh)} kWh</p>
		</div>
	{/if}

	<!-- Legend -->
	<div class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
		<span>Less</span>
		<div class="heatmap-cell level-0 h-3.5 w-3.5 rounded-sm"></div>
		<div class="heatmap-cell level-1 h-3.5 w-3.5 rounded-sm"></div>
		<div class="heatmap-cell level-2 h-3.5 w-3.5 rounded-sm"></div>
		<div class="heatmap-cell level-3 h-3.5 w-3.5 rounded-sm"></div>
		<div class="heatmap-cell level-4 h-3.5 w-3.5 rounded-sm"></div>
		<div class="heatmap-cell level-5 h-3.5 w-3.5 rounded-sm"></div>
		<span>More</span>
	</div>
{:else}
	<div class="flex h-[200px] w-full items-center justify-center bg-muted/20">
		<p class="text-sm text-muted-foreground">Loading heatmap...</p>
	</div>
{/if}

<style>
	.heatmap-cell {
		width: 14px;
		height: 14px;
	}
	.level-0 {
		background-color: var(--muted);
	}
	.level-1 {
		background-color: color-mix(in oklch, var(--chart-1) 20%, transparent);
	}
	.level-2 {
		background-color: color-mix(in oklch, var(--chart-1) 40%, transparent);
	}
	.level-3 {
		background-color: color-mix(in oklch, var(--chart-1) 60%, transparent);
	}
	.level-4 {
		background-color: color-mix(in oklch, var(--chart-1) 80%, transparent);
	}
	.level-5 {
		background-color: var(--chart-1);
	}
</style>
