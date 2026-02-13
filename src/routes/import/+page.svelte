<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as Card from "$lib/components/ui/card";
	import { RESOURCE_CONFIG, type ResourceType } from "$lib/resource";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();

	const resource = $derived(page.data.resource as ResourceType);
	const config = $derived(RESOURCE_CONFIG[resource]);
	const pasteExample = $derived(
		resource === "water"
			? "Datum\tVatten L\n2026-02-02 (måndag)\t1 000"
			: "Datum\tEl kWh\n2026-02-02 (måndag)\t101,895"
	);
	let uploading = $state(false);
	let pasting = $state(false);

	function formatDate(timestamp: string) {
		return timestamp.split("T")[0];
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-3xl font-bold">Import {config.label.split(" ")[0]} Data</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title>Upload CSV file</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/upload"
				enctype="multipart/form-data"
				use:enhance={() => {
					uploading = true;
					return async ({ update }) => {
						await update();
						uploading = false;
					};
				}}
			>
				<div class="mb-4">
					<label for="file" class="mb-2 block text-sm font-medium">Select CSV file</label>
					<input
						type="file"
						id="file"
						name="file"
						accept=".csv,.txt"
						required
						class="block w-full rounded-md border px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
						disabled={uploading}
					/>
					<p class="mt-2 text-sm text-muted-foreground">
						Upload a semicolon-separated CSV file with daily {config.unit} consumption data
					</p>
				</div>

				<Button type="submit" disabled={uploading}>
					{uploading ? "Uploading..." : "Upload"}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="mt-6">
		<Card.Header>
			<Card.Title>Paste data</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/paste"
				use:enhance={() => {
					pasting = true;
					return async ({ update }) => {
						await update();
						pasting = false;
					};
				}}
			>
				<div class="mb-4">
					<label for="text" class="mb-2 block text-sm font-medium">Paste consumption data</label>
					<Textarea
						id="text"
						name="text"
						rows={8}
						placeholder={pasteExample}
						required
						disabled={pasting}
					/>
					<p class="mt-2 text-sm text-muted-foreground">
						Paste tab-separated data with header row (e.g. from a spreadsheet)
					</p>
				</div>

				<Button type="submit" disabled={pasting}>
					{pasting ? "Importing..." : "Import"}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#if form?.error}
		<div class="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
			<h2 class="mb-2 text-lg font-semibold text-destructive">Error</h2>
			<p class="text-sm text-destructive">{form.error}</p>
		</div>
	{/if}

	{#if form?.success}
		<Card.Root class="mt-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
			<Card.Header>
				<Card.Title class="text-green-800 dark:text-green-200">Import Complete</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
					<div class="rounded-md bg-card p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Total Rows</p>
						<p class="text-2xl font-bold">{form.totalRows}</p>
					</div>

					<div class="rounded-md bg-card p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Inserted</p>
						<p class="text-2xl font-bold text-green-600 dark:text-green-400">{form.inserted}</p>
					</div>

					<div class="rounded-md bg-card p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Updated</p>
						<p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{form.updated}</p>
					</div>

					<div class="rounded-md bg-card p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Errors</p>
						<p class="text-2xl font-bold text-destructive">{form.errors}</p>
					</div>
				</div>

				{#if form.dateRange}
					<div class="mt-4 rounded-md bg-card p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Date Range</p>
						<p class="text-lg font-semibold">
							{formatDate(form.dateRange.from)} to {formatDate(form.dateRange.to)}
						</p>
					</div>
				{/if}

				{#if form.parseErrors && form.parseErrors.length > 0}
					<div class="mt-4 rounded-md bg-card p-4 shadow-sm">
						<p class="mb-2 text-sm font-medium">Parse Errors:</p>
						<ul class="space-y-1 text-sm text-destructive">
							{#each form.parseErrors as error, i (i)}
								<li>Line {error.line}: {error.error}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
