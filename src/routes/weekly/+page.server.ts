import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import {
	getCurrentWeek,
	getWeekDateRange,
	getMondayOfISOWeek,
	navigateWeek
} from "$lib/utils/date-utils";

export const load: PageServerLoad = async ({ url }) => {
	// Get week from URL params or default to current week
	const current = getCurrentWeek();
	const year = parseInt(url.searchParams.get("year") ?? String(current.year));
	const week = parseInt(url.searchParams.get("week") ?? String(current.week));

	// Get date range for the week (Monday to Sunday)
	const weekDates = getWeekDateRange(year, week);
	const startDate = weekDates[0];
	const endDate = weekDates[6];

	// Fetch consumption data for the week
	const weekData = await db
		.select()
		.from(consumption)
		.where(
			and(
				gte(consumption.timestamp, `${startDate}T00:00:00`),
				lte(consumption.timestamp, `${endDate}T23:59:59`)
			)
		)
		.orderBy(consumption.timestamp);

	// Create a map of date -> kWh for easier lookup
	const dataMap = new Map<string, number>();
	weekData.forEach((row) => {
		const date = row.timestamp.split("T")[0];
		dataMap.set(date, row.kwh);
	});

	// Build array of daily values (null if no data)
	const dailyValues = weekDates.map((date) => dataMap.get(date) ?? null);

	// Calculate stats (filter out nulls)
	const validValues = dailyValues.filter((v) => v !== null) as number[];
	const total = validValues.reduce((sum, val) => sum + val, 0);
	const average = validValues.length > 0 ? total / validValues.length : 0;
	const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;
	const peakDay = {
		index: dailyValues.indexOf(maxValue),
		value: maxValue
	};

	// Calculate rolling 4-week average (excluding current week)
	const previousWeek = navigateWeek(year, week, -1);
	const fourWeeksAgo = navigateWeek(previousWeek.year, previousWeek.week, -3);
	const rollingStartDate = getWeekDateRange(fourWeeksAgo.year, fourWeeksAgo.week)[0];
	const rollingEndDate = getWeekDateRange(previousWeek.year, previousWeek.week)[6];

	const rollingData = await db
		.select({
			total: sql<number>`SUM(${consumption.kwh})`
		})
		.from(consumption)
		.where(
			and(
				gte(consumption.timestamp, `${rollingStartDate}T00:00:00`),
				lte(consumption.timestamp, `${rollingEndDate}T23:59:59`)
			)
		);

	const rollingTotal = rollingData[0]?.total ?? 0;
	const rollingAverage = rollingTotal / 4;

	// Calculate previous week stats for comparison
	const prevWeekDates = getWeekDateRange(previousWeek.year, previousWeek.week);
	const prevWeekData = await db
		.select()
		.from(consumption)
		.where(
			and(
				gte(consumption.timestamp, `${prevWeekDates[0]}T00:00:00`),
				lte(consumption.timestamp, `${prevWeekDates[6]}T23:59:59`)
			)
		)
		.orderBy(consumption.timestamp);

	// Create a map of date -> kWh for previous week
	const prevDataMap = new Map<string, number>();
	prevWeekData.forEach((row) => {
		const date = row.timestamp.split("T")[0];
		prevDataMap.set(date, row.kwh);
	});

	// Build array of daily values for previous week (null if no data)
	const prevDailyValues = prevWeekDates.map((date) => prevDataMap.get(date) ?? null);

	const previousTotal = prevWeekData.reduce((sum, row) => sum + row.kwh, 0);
	const percentChange = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

	// Navigation
	const prev = navigateWeek(year, week, -1);
	const next = navigateWeek(year, week, 1);

	return {
		year,
		week,
		weekDates,
		dailyValues,
		prevDailyValues,
		stats: {
			total,
			average,
			peakDay,
			rollingAverage,
			previousTotal,
			percentChange
		},
		navigation: {
			prev,
			next,
			isCurrent: year === current.year && week === current.week
		}
	};
};
