import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { gte, sql } from "drizzle-orm";

export const load: PageServerLoad = async ({ url }) => {
	// Day-of-week averages (SQLite %w: 0=Sun..6=Sat → reorder to Mon–Sun)
	const dowData = await db
		.select({
			dow: sql<number>`cast(strftime('%w', ${consumption.timestamp}) as integer)`,
			avgKwh: sql<number>`AVG(${consumption.kwh})`
		})
		.from(consumption)
		.groupBy(sql`strftime('%w', ${consumption.timestamp})`)
		.orderBy(sql`strftime('%w', ${consumption.timestamp})`);

	// Map 0=Sun..6=Sat → Mon–Sun order
	const dowMap = new Map<number, number>();
	dowData.forEach((row) => dowMap.set(row.dow, row.avgKwh));

	const dayOfWeekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const dayOfWeekOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon=1..Sat=6, Sun=0
	const dayOfWeekValues = dayOfWeekOrder.map((dow) => dowMap.get(dow) ?? null);

	// Month-of-year averages
	const monthData = await db
		.select({
			month: sql<number>`cast(strftime('%m', ${consumption.timestamp}) as integer)`,
			avgKwh: sql<number>`AVG(${consumption.kwh})`
		})
		.from(consumption)
		.groupBy(sql`strftime('%m', ${consumption.timestamp})`)
		.orderBy(sql`strftime('%m', ${consumption.timestamp})`);

	const monthLabels = [
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
	const monthMap = new Map<number, number>();
	monthData.forEach((row) => monthMap.set(row.month, row.avgKwh));
	const monthOfYearValues = Array.from({ length: 12 }, (_, i) => monthMap.get(i + 1) ?? null);

	// Heatmap data — aggregate daily totals, optionally limited by months param
	const months = parseInt(url.searchParams.get("months") ?? "3");
	const cutoffDate = new Date();
	cutoffDate.setMonth(cutoffDate.getMonth() - months);
	const cutoffStr = cutoffDate.toISOString().split("T")[0];

	const heatmapData = await db
		.select({
			date: sql<string>`substr(${consumption.timestamp}, 1, 10)`,
			kwh: sql<number>`SUM(${consumption.kwh})`
		})
		.from(consumption)
		.where(gte(consumption.timestamp, `${cutoffStr}T00:00:00`))
		.groupBy(sql`substr(${consumption.timestamp}, 1, 10)`)
		.orderBy(sql`substr(${consumption.timestamp}, 1, 10)`);

	return {
		dayOfWeek: {
			labels: dayOfWeekLabels,
			values: dayOfWeekValues
		},
		monthOfYear: {
			labels: monthLabels,
			values: monthOfYearValues
		},
		heatmap: heatmapData.map((row) => ({ date: row.date, kwh: row.kwh })),
		months
	};
};
