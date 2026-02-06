<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();
	let uploading = $state(false);

	function formatDate(timestamp: string) {
		return timestamp.split("T")[0];
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-3xl font-bold">Import Consumption Data</h1>

	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
				<label for="file" class="mb-2 block text-sm font-medium text-gray-700">
					Select CSV file
				</label>
				<input
					type="file"
					id="file"
					name="file"
					accept=".csv,.txt"
					required
					class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					disabled={uploading}
				/>
				<p class="mt-2 text-sm text-gray-500">
					Upload a semicolon-separated CSV file with daily consumption data
				</p>
			</div>

			<button
				type="submit"
				disabled={uploading}
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{uploading ? "Uploading..." : "Upload"}
			</button>
		</form>
	</div>

	{#if form?.error}
		<div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
			<h2 class="mb-2 text-lg font-semibold text-red-800">Error</h2>
			<p class="text-sm text-red-700">{form.error}</p>
		</div>
	{/if}

	{#if form?.success}
		<div class="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
			<h2 class="mb-4 text-xl font-semibold text-green-800">Import Complete</h2>

			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-md bg-white p-4 shadow-sm">
					<p class="text-sm text-gray-600">Total Rows</p>
					<p class="text-2xl font-bold text-gray-900">{form.totalRows}</p>
				</div>

				<div class="rounded-md bg-white p-4 shadow-sm">
					<p class="text-sm text-gray-600">Inserted</p>
					<p class="text-2xl font-bold text-green-600">{form.inserted}</p>
				</div>

				<div class="rounded-md bg-white p-4 shadow-sm">
					<p class="text-sm text-gray-600">Skipped</p>
					<p class="text-2xl font-bold text-yellow-600">{form.skipped}</p>
				</div>

				<div class="rounded-md bg-white p-4 shadow-sm">
					<p class="text-sm text-gray-600">Errors</p>
					<p class="text-2xl font-bold text-red-600">{form.errors}</p>
				</div>
			</div>

			{#if form.dateRange}
				<div class="mt-4 rounded-md bg-white p-4 shadow-sm">
					<p class="text-sm text-gray-600">Date Range</p>
					<p class="text-lg font-semibold text-gray-900">
						{formatDate(form.dateRange.from)} to {formatDate(form.dateRange.to)}
					</p>
				</div>
			{/if}

			{#if form.parseErrors && form.parseErrors.length > 0}
				<div class="mt-4 rounded-md bg-white p-4 shadow-sm">
					<p class="mb-2 text-sm font-medium text-gray-700">Parse Errors:</p>
					<ul class="space-y-1 text-sm text-red-600">
						{#each form.parseErrors as error, i (i)}
							<li>Line {error.line}: {error.error}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>
