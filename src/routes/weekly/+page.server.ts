import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption, targets } from "$lib/server/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getCurrentWeek, getWeekDateRange, navigateWeek } from "$lib/utils/date-utils";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url, locals }) => {
	const resource = locals.resource;

	// Water data is meaningless at weekly granularity
	if (resource === "water") {
		redirect(302, "/monthly");
	}

	// Get week from URL params or default to current week
	const current = getCurrentWeek();
	let year = parseInt(url.searchParams.get("year") ?? String(current.year));
	let week = parseInt(url.searchParams.get("week") ?? String(current.week));
	if (isNaN(year)) year = current.year;
	if (isNaN(week)) week = current.week;

	// Parse comparison params (default to previous week)
	const previousWeek = navigateWeek(year, week, -1);
	const compareYearParam = url.searchParams.get("compare_year");
	const compareWeekParam = url.searchParams.get("compare_week");
	const hasCustomCompare = compareYearParam !== null && compareWeekParam !== null;
	let compareYear = hasCustomCompare ? parseInt(compareYearParam) : previousWeek.year;
	let compareWeek = hasCustomCompare ? parseInt(compareWeekParam) : previousWeek.week;
	if (isNaN(compareYear)) compareYear = previousWeek.year;
	if (isNaN(compareWeek)) compareWeek = previousWeek.week;

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
				eq(consumption.resourceType, resource),
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
				eq(consumption.resourceType, resource),
				gte(consumption.timestamp, `${rollingStartDate}T00:00:00`),
				lte(consumption.timestamp, `${rollingEndDate}T23:59:59`)
			)
		);

	const rollingTotal = rollingData[0]?.total ?? 0;
	const rollingAverage = rollingTotal / 4;

	// Calculate previous week stats (always the actual previous week for stats)
	const prevWeekDates = getWeekDateRange(previousWeek.year, previousWeek.week);
	const prevWeekData = await db
		.select()
		.from(consumption)
		.where(
			and(
				eq(consumption.resourceType, resource),
				gte(consumption.timestamp, `${prevWeekDates[0]}T00:00:00`),
				lte(consumption.timestamp, `${prevWeekDates[6]}T23:59:59`)
			)
		)
		.orderBy(consumption.timestamp);

	const previousTotal = prevWeekData.reduce((sum, row) => sum + row.kwh, 0);
	const percentChange = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

	// Fetch comparison data (custom or previous week)
	const compWeekDates = getWeekDateRange(compareYear, compareWeek);
	let compDailyValues: (number | null)[];

	if (!hasCustomCompare) {
		// Reuse previous week data already fetched
		const prevDataMap = new Map<string, number>();
		prevWeekData.forEach((row) => {
			const date = row.timestamp.split("T")[0];
			prevDataMap.set(date, row.kwh);
		});
		compDailyValues = prevWeekDates.map((date) => prevDataMap.get(date) ?? null);
	} else {
		const compWeekData = await db
			.select()
			.from(consumption)
			.where(
				and(
					eq(consumption.resourceType, resource),
					gte(consumption.timestamp, `${compWeekDates[0]}T00:00:00`),
					lte(consumption.timestamp, `${compWeekDates[6]}T23:59:59`)
				)
			)
			.orderBy(consumption.timestamp);

		const compDataMap = new Map<string, number>();
		compWeekData.forEach((row) => {
			const date = row.timestamp.split("T")[0];
			compDataMap.set(date, row.kwh);
		});
		compDailyValues = compWeekDates.map((date) => compDataMap.get(date) ?? null);
	}

	// Active target
	const today = new Date().toISOString().split("T")[0];
	const activeTarget = await db
		.select()
		.from(targets)
		.where(
			and(
				eq(targets.periodType, "weekly"),
				eq(targets.resourceType, resource),
				lte(targets.validFrom, today)
			)
		)
		.orderBy(desc(targets.validFrom))
		.limit(1);

	// Navigation
	const prev = navigateWeek(year, week, -1);
	const next = navigateWeek(year, week, 1);

	return {
		year,
		week,
		weekDates,
		dailyValues,
		comparisonDailyValues: compDailyValues,
		comparison: {
			year: compareYear,
			week: compareWeek,
			isCustom: hasCustomCompare
		},
		stats: {
			total,
			average,
			peakDay,
			rollingAverage,
			previousTotal,
			percentChange
		},
		target: activeTarget[0]
			? { value: activeTarget[0].kwhTarget, validFrom: activeTarget[0].validFrom }
			: null,
		navigation: {
			prev,
			next,
			isCurrent: year === current.year && week === current.week
		}
	};
};
