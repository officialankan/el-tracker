import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { and, gte, lt, sql } from "drizzle-orm";

export const load: PageServerLoad = async ({ url }) => {
	// Read period filter params
	const period = url.searchParams.get("period") ?? "all";
	const yearParam = parseInt(url.searchParams.get("year") ?? "");
	const monthParam = parseInt(url.searchParams.get("month") ?? "");

	// Query available years from data
	const yearRange = await db
		.select({
			minYear: sql<number>`cast(strftime('%Y', MIN(${consumption.timestamp})) as integer)`,
			maxYear: sql<number>`cast(strftime('%Y', MAX(${consumption.timestamp})) as integer)`
		})
		.from(consumption);

	const minYear = yearRange[0]?.minYear ?? new Date().getFullYear();
	const maxYear = yearRange[0]?.maxYear ?? new Date().getFullYear();
	const availableYears = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

	// Build date range filter based on period
	let startDate: string | null = null;
	let endDate: string | null = null;
	const validYear = !isNaN(yearParam) && yearParam >= minYear && yearParam <= maxYear;

	if (period === "year" && validYear) {
		startDate = `${yearParam}-01-01T00:00:00`;
		endDate = `${yearParam + 1}-01-01T00:00:00`;
	} else if (
		period === "month" &&
		validYear &&
		!isNaN(monthParam) &&
		monthParam >= 1 &&
		monthParam <= 12
	) {
		const mm = String(monthParam).padStart(2, "0");
		startDate = `${yearParam}-${mm}-01T00:00:00`;
		// Next month
		if (monthParam === 12) {
			endDate = `${yearParam + 1}-01-01T00:00:00`;
		} else {
			const nextMm = String(monthParam + 1).padStart(2, "0");
			endDate = `${yearParam}-${nextMm}-01T00:00:00`;
		}
	}

	const periodFilter =
		startDate && endDate
			? and(gte(consumption.timestamp, startDate), lt(consumption.timestamp, endDate))
			: undefined;

	// Day-of-week averages (SQLite %w: 0=Sun..6=Sat → reorder to Mon–Sun)
	const dowData = await db
		.select({
			dow: sql<number>`cast(strftime('%w', ${consumption.timestamp}) as integer)`,
			avgKwh: sql<number>`AVG(${consumption.kwh})`
		})
		.from(consumption)
		.where(periodFilter)
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
		.where(periodFilter)
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

	// Heatmap data — when period filter is active, show all data in that period;
	// otherwise use the months param for "All time" mode
	let heatmapFilter = periodFilter;
	let months = 3;

	if (!periodFilter) {
		months = parseInt(url.searchParams.get("months") ?? "3");
		if (isNaN(months) || months <= 0) months = 3;
		const cutoffDate = new Date();
		cutoffDate.setMonth(cutoffDate.getMonth() - months);
		const cutoffStr = cutoffDate.toISOString().split("T")[0];
		heatmapFilter = gte(consumption.timestamp, `${cutoffStr}T00:00:00`);
	}

	const heatmapData = await db
		.select({
			date: sql<string>`substr(${consumption.timestamp}, 1, 10)`,
			kwh: sql<number>`SUM(${consumption.kwh})`
		})
		.from(consumption)
		.where(heatmapFilter)
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
		months,
		period: periodFilter ? period : "all",
		year: validYear ? yearParam : null,
		month: !isNaN(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : null,
		availableYears
	};
};
