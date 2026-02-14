import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { consumption, targets } from "$lib/server/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getCurrentMonth, getMonthDateRange } from "$lib/utils/date-utils";

export const load: PageServerLoad = async ({ locals }) => {
	const resource = locals.resource;
	const current = getCurrentMonth();
	const { year, month } = current;

	const monthDates = getMonthDateRange(year, month);
	const startDate = monthDates[0];
	const endDate = monthDates[monthDates.length - 1];

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

	const dataMap = new Map<string, number>();
	monthData.forEach((row) => {
		const date = row.timestamp.split("T")[0];
		dataMap.set(date, row.kwh);
	});

	const dailyValues = monthDates.map((date) => dataMap.get(date) ?? null);
	const validValues = dailyValues.filter((v): v is number => v !== null);
	const total = validValues.reduce((sum, val) => sum + val, 0);
	const average = validValues.length > 0 ? total / validValues.length : 0;

	const totalDaysInMonth = monthDates.length;
	const daysWithData = validValues.length;
	const projection =
		daysWithData > 0 && daysWithData < totalDaysInMonth
			? (total / daysWithData) * totalDaysInMonth
			: null;

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

	return {
		year,
		month,
		stats: {
			total,
			average,
			projection,
			daysWithData,
			totalDaysInMonth
		},
		target: activeTarget[0]
			? { value: activeTarget[0].kwhTarget, validFrom: activeTarget[0].validFrom }
			: null
	};
};
