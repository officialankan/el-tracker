<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { BarChart3, Upload } from "@lucide/svelte";
</script>

<div class="container mx-auto max-w-2xl space-y-8 p-6">
	<div>
		<h1 class="mb-2 text-3xl font-bold">Electricity Consumption Tracker</h1>
		<p class="text-muted-foreground">
			Track and analyze your household electricity consumption with powerful visualizations and
			insights.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<Card.Root class="transition-shadow hover:shadow-md">
			<Card.Header>
				<div class="flex items-center gap-2">
					<Upload class="h-5 w-5" />
					<Card.Title>Import Data</Card.Title>
				</div>
				<Card.Description>Upload your electricity consumption CSV file</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button href="/import" class="w-full">Go to Import</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root class="transition-shadow hover:shadow-md">
			<Card.Header>
				<div class="flex items-center gap-2">
					<BarChart3 class="h-5 w-5" />
					<Card.Title>Weekly Analysis</Card.Title>
				</div>
				<Card.Description>View weekly consumption patterns and trends</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button href="/weekly" class="w-full">View Weekly</Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>
