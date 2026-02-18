import type { Actions, PageServerLoad } from "./$types";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { parseConsumptionCSV, parsePastedConsumption } from "$lib/utils/csv-parser";
import type { ParseResult } from "$lib/utils/csv-parser";
import { fail } from "@sveltejs/kit";
import { findDateGaps } from "$lib/utils/gaps";
import type { DateGap } from "$lib/utils/gaps";

export const load: PageServerLoad = async ({ locals, url }) => {
	const resource = locals.resource;
	const dateColumn = sql<string>`substr(${consumption.timestamp}, 1, 10)`.as("date");

	const rows = await db
		.selectDistinct({ date: dateColumn })
		.from(consumption)
		.where(eq(consumption.resourceType, resource))
		.orderBy(desc(dateColumn))
		.limit(5);

	const checkGaps = url.searchParams.has("gaps");
	let gaps: DateGap[] = [];
	if (checkGaps) {
		const allDates = await db
			.selectDistinct({ date: dateColumn })
			.from(consumption)
			.where(eq(consumption.resourceType, resource))
			.orderBy(asc(dateColumn));
		gaps = findDateGaps(allDates.map((r) => r.date));
	}

	return {
		latestDates: rows.map((r) => r.date),
		gaps,
		gapsChecked: checkGaps
	};
};

async function insertRows(parseResult: ParseResult) {
	let inserted = 0;
	let updated = 0;
	let errors = parseResult.errors.length;
	const resourceType = parseResult.resourceType;

	for (const row of parseResult.rows) {
		try {
			const existing = await db
				.select({ kwh: consumption.kwh })
				.from(consumption)
				.where(
					and(eq(consumption.timestamp, row.timestamp), eq(consumption.resourceType, resourceType))
				)
				.get();

			await db
				.insert(consumption)
				.values({
					timestamp: row.timestamp,
					kwh: row.kwh,
					resourceType
				})
				.onConflictDoUpdate({
					target: [consumption.timestamp, consumption.resourceType],
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

	let dateRange = null;
	if (parseResult.rows.length > 0) {
		const timestamps = parseResult.rows.map((r) => r.timestamp).sort();
		dateRange = {
			from: timestamps[0],
			to: timestamps[timestamps.length - 1]
		};
	}

	return {
		success: true as const,
		inserted,
		updated,
		errors,
		totalRows: parseResult.rows.length,
		dateRange,
		parseErrors: parseResult.errors
	};
}

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
			return await insertRows(parseResult);
		} catch (err) {
			console.error("Upload error:", err);
			return fail(500, {
				error: err instanceof Error ? err.message : "Failed to process file"
			});
		}
	},

	paste: async ({ request }) => {
		const formData = await request.formData();
		const text = formData.get("text") as string;

		if (!text || text.trim().length === 0) {
			return fail(400, { error: "No data pasted" });
		}

		try {
			const parseResult = parsePastedConsumption(text);
			return await insertRows(parseResult);
		} catch (err) {
			console.error("Paste import error:", err);
			return fail(500, {
				error: err instanceof Error ? err.message : "Failed to process pasted data"
			});
		}
	}
} satisfies Actions;
