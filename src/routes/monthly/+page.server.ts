import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption, targets } from "$lib/server/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getCurrentMonth, getMonthDateRange, navigateMonth } from "$lib/utils/date-utils";

export const load: PageServerLoad = async ({ url, locals }) => {
	const resource = locals.resource;
	// Get month from URL params or default to current month
	const current = getCurrentMonth();
	let year = parseInt(url.searchParams.get("year") ?? String(current.year));
	let month = parseInt(url.searchParams.get("month") ?? String(current.month));
	if (isNaN(year)) year = current.year;
	if (isNaN(month)) month = current.month;

	// Get date range for the month
	const monthDates = getMonthDateRange(year, month);
	const startDate = monthDates[0];
	const endDate = monthDates[monthDates.length - 1];

	// Fetch consumption data for the month
	const monthData = await db
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
	monthData.forEach((row) => {
		const date = row.timestamp.split("T")[0];
		dataMap.set(date, row.kwh);
	});

	// Build array of daily values (null if no data)
	const dailyValues = monthDates.map((date) => dataMap.get(date) ?? null);

	// Calculate stats (filter out nulls)
	const validValues = dailyValues.filter((v) => v !== null) as number[];
	const total = validValues.reduce((sum, val) => sum + val, 0);
	const average = validValues.length > 0 ? total / validValues.length : 0;
	const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;
	const peakDay = {
		index: dailyValues.indexOf(maxValue),
		value: maxValue
	};

	// Projection for incomplete months
	const totalDaysInMonth = monthDates.length;
	const daysWithData = validValues.length;
	const projection =
		daysWithData > 0 && daysWithData < totalDaysInMonth
			? (total / daysWithData) * totalDaysInMonth
			: null;

	// Calculate rolling 3-month average (excluding current month)
	const prevMonth = navigateMonth(year, month, -1);
	const threeMonthsAgo = navigateMonth(
		navigateMonth(prevMonth.year, prevMonth.month, -1).year,
		navigateMonth(prevMonth.year, prevMonth.month, -1).month,
		-1
	);

	let rollingTotal = 0;
	let monthsWithData = 0;
	let rollingMonth = { year: threeMonthsAgo.year, month: threeMonthsAgo.month };
	for (let i = 0; i < 3; i++) {
		const monthDates = getMonthDateRange(rollingMonth.year, rollingMonth.month);
		const result = await db
			.select({
				total: sql<number>`SUM(${consumption.kwh})`
			})
			.from(consumption)
			.where(
				and(
					eq(consumption.resourceType, resource),
					gte(consumption.timestamp, `${monthDates[0]}T00:00:00`),
					lte(consumption.timestamp, `${monthDates[monthDates.length - 1]}T23:59:59`)
				)
			);
		if (result[0]?.total != null) {
			rollingTotal += result[0].total;
			monthsWithData++;
		}
		rollingMonth = navigateMonth(rollingMonth.year, rollingMonth.month, 1);
	}
	const rollingAverage = monthsWithData > 0 ? rollingTotal / monthsWithData : 0;

	// Parse comparison params (default to previous month)
	const compareYearParam = url.searchParams.get("compare_year");
	const compareMonthParam = url.searchParams.get("compare_month");
	const hasCustomCompare = compareYearParam !== null && compareMonthParam !== null;
	let compareYear = hasCustomCompare ? parseInt(compareYearParam) : prevMonth.year;
	let compareMonth = hasCustomCompare ? parseInt(compareMonthParam) : prevMonth.month;
	if (isNaN(compareYear)) compareYear = prevMonth.year;
	if (isNaN(compareMonth)) compareMonth = prevMonth.month;

	// Calculate previous month stats (always the actual previous month for stats)
	const prevMonthDates = getMonthDateRange(prevMonth.year, prevMonth.month);
	const prevMonthData = await db
		.select()
		.from(consumption)
		.where(
			and(
				eq(consumption.resourceType, resource),
				gte(consumption.timestamp, `${prevMonthDates[0]}T00:00:00`),
				lte(consumption.timestamp, `${prevMonthDates[prevMonthDates.length - 1]}T23:59:59`)
			)
		)
		.orderBy(consumption.timestamp);

	const previousTotal = prevMonthData.reduce((sum, row) => sum + row.kwh, 0);
	const percentChange = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

	// Fetch comparison data (custom or previous month)
	let compDailyValues: (number | null)[];

	if (!hasCustomCompare) {
		// Reuse previous month data already fetched
		const prevDataMap = new Map<string, number>();
		prevMonthData.forEach((row) => {
			const date = row.timestamp.split("T")[0];
			prevDataMap.set(date, row.kwh);
		});
		compDailyValues = prevMonthDates.map((date) => prevDataMap.get(date) ?? null);
	} else {
		const compMonthDates = getMonthDateRange(compareYear, compareMonth);
		const compMonthData = await db
			.select()
			.from(consumption)
			.where(
				and(
					eq(consumption.resourceType, resource),
					gte(consumption.timestamp, `${compMonthDates[0]}T00:00:00`),
					lte(consumption.timestamp, `${compMonthDates[compMonthDates.length - 1]}T23:59:59`)
				)
			)
			.orderBy(consumption.timestamp);

		const compDataMap = new Map<string, number>();
		compMonthData.forEach((row) => {
			const date = row.timestamp.split("T")[0];
			compDataMap.set(date, row.kwh);
		});
		compDailyValues = compMonthDates.map((date) => compDataMap.get(date) ?? null);
	}

	// Active target
	const today = new Date().toISOString().split("T")[0];
	const activeTarget = await db
		.select()
		.from(targets)
		.where(
			and(
				eq(targets.periodType, "monthly"),
				eq(targets.resourceType, resource),
				lte(targets.validFrom, today)
			)
		)
		.orderBy(desc(targets.validFrom))
		.limit(1);

	// Navigation
	const prev = navigateMonth(year, month, -1);
	const next = navigateMonth(year, month, 1);

	return {
		year,
		month,
		monthDates,
		dailyValues,
		comparisonDailyValues: compDailyValues,
		comparison: {
			year: compareYear,
			month: compareMonth,
			isCustom: hasCustomCompare
		},
		stats: {
			total,
			average,
			peakDay,
			rollingAverage,
			previousTotal,
			percentChange,
			projection
		},
		target: activeTarget[0]
			? { value: activeTarget[0].kwhTarget, validFrom: activeTarget[0].validFrom }
			: null,
		navigation: {
			prev,
			next,
			isCurrent: year === current.year && month === current.month
		}
	};
};
