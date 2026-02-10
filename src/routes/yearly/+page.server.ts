import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption } from "$lib/server/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import { getCurrentYear, getYearMonths, getMonthDateRange } from "$lib/utils/date-utils";

export const load: PageServerLoad = async ({ url }) => {
	const currentYear = getCurrentYear();
	const year = parseInt(url.searchParams.get("year") ?? String(currentYear));

	const months = getYearMonths(year);

	// For each month, query total consumption
	const monthlyTotals: (number | null)[] = [];
	for (const { year: y, month } of months) {
		const dates = getMonthDateRange(y, month);
		const startDate = dates[0];
		const endDate = dates[dates.length - 1];

		const result = await db
			.select({
				total: sql<number>`SUM(${consumption.kwh})`
			})
			.from(consumption)
			.where(
				and(
					gte(consumption.timestamp, `${startDate}T00:00:00`),
					lte(consumption.timestamp, `${endDate}T23:59:59`)
				)
			);

		const total = result[0]?.total;
		monthlyTotals.push(total != null ? total : null);
	}

	// Calculate stats
	const validValues = monthlyTotals.filter((v) => v !== null) as number[];
	const total = validValues.reduce((sum, val) => sum + val, 0);
	const average = validValues.length > 0 ? total / validValues.length : 0;
	const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;
	const peakDay = {
		index: monthlyTotals.indexOf(maxValue),
		value: maxValue
	};

	// Projection for incomplete years (based on days with data for accuracy)
	const yearStart = `${year}-01-01`;
	const yearEnd = `${year}-12-31`;
	const daysInYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;

	const daysWithDataResult = await db
		.select({
			count: sql<number>`COUNT(DISTINCT DATE(${consumption.timestamp}))`
		})
		.from(consumption)
		.where(
			and(
				gte(consumption.timestamp, `${yearStart}T00:00:00`),
				lte(consumption.timestamp, `${yearEnd}T23:59:59`)
			)
		);

	const daysWithData = daysWithDataResult[0]?.count ?? 0;
	const projection =
		daysWithData > 0 && daysWithData < daysInYear ? (total / daysWithData) * daysInYear : null;

	// Rolling 3-year average (excluding current year)
	let rollingAverage = 0;
	if (year > 2) {
		const rollingYears = [year - 3, year - 2, year - 1];
		let rollingTotal = 0;
		let yearsWithData = 0;

		for (const ry of rollingYears) {
			const ryDates = getMonthDateRange(ry, 1);
			const ryStartDate = ryDates[0];
			const ryEndDates = getMonthDateRange(ry, 12);
			const ryEndDate = ryEndDates[ryEndDates.length - 1];

			const result = await db
				.select({
					total: sql<number>`SUM(${consumption.kwh})`
				})
				.from(consumption)
				.where(
					and(
						gte(consumption.timestamp, `${ryStartDate}T00:00:00`),
						lte(consumption.timestamp, `${ryEndDate}T23:59:59`)
					)
				);

			if (result[0]?.total != null) {
				rollingTotal += result[0].total;
				yearsWithData++;
			}
		}

		rollingAverage = yearsWithData > 0 ? rollingTotal / yearsWithData : 0;
	}

	// Previous year data for comparison
	const prevYear = year - 1;
	const prevMonths = getYearMonths(prevYear);
	const prevMonthlyTotals: (number | null)[] = [];

	for (const { year: py, month } of prevMonths) {
		const dates = getMonthDateRange(py, month);
		const startDate = dates[0];
		const endDate = dates[dates.length - 1];

		const result = await db
			.select({
				total: sql<number>`SUM(${consumption.kwh})`
			})
			.from(consumption)
			.where(
				and(
					gte(consumption.timestamp, `${startDate}T00:00:00`),
					lte(consumption.timestamp, `${endDate}T23:59:59`)
				)
			);

		const t = result[0]?.total;
		prevMonthlyTotals.push(t != null ? t : null);
	}

	const prevValidValues = prevMonthlyTotals.filter((v) => v !== null) as number[];
	const previousTotal = prevValidValues.reduce((sum, val) => sum + val, 0);
	const percentChange = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

	return {
		year,
		monthlyTotals,
		prevMonthlyTotals,
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
			prev: year - 1,
			next: year + 1,
			isCurrent: year === currentYear
		}
	};
};
