import type { Actions } from "./$types";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { parseConsumptionCSV } from "$lib/utils/csv-parser";
import { fail } from "@sveltejs/kit";

export const actions = {
	upload: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file || file.size === 0) {
			return fail(400, { error: "No file uploaded" });
		}

		if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
			return fail(400, { error: "Invalid file type. Please upload a .csv or .txt file" });
		}

		try {
			const text = await file.text();
			const parseResult = parseConsumptionCSV(text);

			let inserted = 0;
			let updated = 0;
			let errors = parseResult.errors.length;

			// Insert rows into database, replacing duplicates with newer data
			for (const row of parseResult.rows) {
				try {
					const existing = await db
						.select({ kwh: consumption.kwh })
						.from(consumption)
						.where(eq(consumption.timestamp, row.timestamp))
						.get();

					await db
						.insert(consumption)
						.values({
							timestamp: row.timestamp,
							kwh: row.kwh
						})
						.onConflictDoUpdate({
							target: consumption.timestamp,
							set: { kwh: row.kwh }
						})
						.run();

					if (existing) {
						updated++;
					} else {
						inserted++;
					}
				} catch (err) {
					errors++;
					console.error("Insert error:", err);
				}
			}

			// Calculate date range
			let dateRange = null;
			if (parseResult.rows.length > 0) {
				const timestamps = parseResult.rows.map((r) => r.timestamp).sort();
				dateRange = {
					from: timestamps[0],
					to: timestamps[timestamps.length - 1]
				};
			}

			return {
				success: true,
				inserted,
				updated,
				errors,
				totalRows: parseResult.rows.length,
				dateRange,
				parseErrors: parseResult.errors
			};
		} catch (err) {
			console.error("Upload error:", err);
			return fail(500, {
				error: err instanceof Error ? err.message : "Failed to process file"
			});
		}
	}
} satisfies Actions;
