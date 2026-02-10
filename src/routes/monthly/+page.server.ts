import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import { getCurrentMonth, getMonthDateRange, navigateMonth } from "$lib/utils/date-utils";

export const load: PageServerLoad = async ({ url }) => {
	// Get month from URL params or default to current month
	const current = getCurrentMonth();
	const year = parseInt(url.searchParams.get("year") ?? String(current.year));
	const month = parseInt(url.searchParams.get("month") ?? String(current.month));

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
	const rollingStartDate = getMonthDateRange(threeMonthsAgo.year, threeMonthsAgo.month)[0];
	const rollingEndDates = getMonthDateRange(prevMonth.year, prevMonth.month);
	const rollingEndDate = rollingEndDates[rollingEndDates.length - 1];

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
	const rollingAverage = rollingTotal / 3;

	// Calculate previous month stats for comparison
	const prevMonthDates = getMonthDateRange(prevMonth.year, prevMonth.month);
	const prevMonthData = await db
		.select()
		.from(consumption)
		.where(
			and(
				gte(consumption.timestamp, `${prevMonthDates[0]}T00:00:00`),
				lte(consumption.timestamp, `${prevMonthDates[prevMonthDates.length - 1]}T23:59:59`)
			)
		)
		.orderBy(consumption.timestamp);

	// Create a map of date -> kWh for previous month
	const prevDataMap = new Map<string, number>();
	prevMonthData.forEach((row) => {
		const date = row.timestamp.split("T")[0];
		prevDataMap.set(date, row.kwh);
	});

	// Build array of daily values for previous month (null if no data)
	const prevDailyValues = prevMonthDates.map((date) => prevDataMap.get(date) ?? null);

	const previousTotal = prevMonthData.reduce((sum, row) => sum + row.kwh, 0);
	const percentChange = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

	// Navigation
	const prev = navigateMonth(year, month, -1);
	const next = navigateMonth(year, month, 1);

	return {
		year,
		month,
		monthDates,
		dailyValues,
		prevDailyValues,
		stats: {
			total,
			average,
			peakDay,
			rollingAverage,
			previousTotal,
			percentChange,
			projection
		},
		navigation: {
			prev,
			next,
			isCurrent: year === current.year && month === current.month
		}
	};
};
