<script lang="ts">
	import { getChartContext } from "layerchart";

	interface Props {
		value: number;
	}

	let { value }: Props = $props();

	const ctx = getChartContext();

	const pixelY = $derived(ctx.yScale(value));
	const x1 = $derived(ctx.xRange[0] ?? 0);
	const x2 = $derived(ctx.xRange[1] ?? 0);
</script>

<line
	{x1}
	y1={pixelY}
	{x2}
	y2={pixelY}
	class="stroke-muted-foreground"
	stroke-width="2"
	stroke-dasharray="6 4"
/>
