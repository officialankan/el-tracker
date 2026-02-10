/**
 * Date utility functions for period calculations using date-fns
 */

import {
	getISOWeek as getWeekNumber,
	getISOWeekYear,
	startOfISOWeek,
	addWeeks,
	addMonths,
	format,
	parseISO,
	eachDayOfInterval,
	endOfISOWeek,
	startOfMonth,
	endOfMonth,
	setISOWeek,
	setYear
} from "date-fns";

/**
 * Get ISO week number and year for a given date
 * @param date Date string in ISO format or Date object
 * @returns Object with year and week number
 */
export function getISOWeek(date: string | Date): { year: number; week: number } {
	const d = typeof date === "string" ? parseISO(date) : date;
	return {
		year: getISOWeekYear(d),
		week: getWeekNumber(d)
	};
}

/**
 * Get the Monday (start) of a given ISO week
 * @param year ISO year
 * @param week ISO week number
 * @returns Date object for the Monday of that week
 */
export function getMondayOfISOWeek(year: number, week: number): Date {
	// Start with any date, set the year and week, then get start of week
	let date = new Date(year, 0, 4); // Start with Jan 4
	date = setYear(date, year);
	date = setISOWeek(date, week);
	return startOfISOWeek(date);
}

/**
 * Get date range for a week (Monday to Sunday)
 * @param year ISO year
 * @param week ISO week number
 * @returns Array of 7 ISO date strings (YYYY-MM-DD)
 */
export function getWeekDateRange(year: number, week: number): string[] {
	const monday = getMondayOfISOWeek(year, week);
	const sunday = endOfISOWeek(monday);

	return eachDayOfInterval({ start: monday, end: sunday }).map((date) =>
		format(date, "yyyy-MM-dd")
	);
}

/**
 * Format a date range as a readable string
 * @param startDate ISO date string
 * @param endDate ISO date string
 * @returns Formatted string like "Feb 3 - Feb 9, 2026"
 */
export function formatDateRange(startDate: string, endDate: string): string {
	const start = parseISO(startDate);
	const end = parseISO(endDate);

	const startMonth = format(start, "MMM");
	const endMonth = format(end, "MMM");
	const startDay = format(start, "d");
	const endDay = format(end, "d");
	const year = format(end, "yyyy");

	if (startMonth === endMonth) {
		return `${startMonth} ${startDay}–${endDay}, ${year}`;
	}
	return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

/**
 * Get current week info
 * @returns Current year and week number
 */
export function getCurrentWeek(): { year: number; week: number } {
	return getISOWeek(new Date());
}

/**
 * Navigate to previous/next week
 * @param year Current year
 * @param week Current week
 * @param direction 1 for next, -1 for previous
 * @returns New year and week
 */
export function navigateWeek(
	year: number,
	week: number,
	direction: 1 | -1
): { year: number; week: number } {
	const monday = getMondayOfISOWeek(year, week);
	const newDate = addWeeks(monday, direction);
	return getISOWeek(newDate);
}

/**
 * Format day of week from date
 * @param dateStr ISO date string
 * @returns Short day name (Mon, Tue, etc.)
 */
export function formatDayOfWeek(dateStr: string): string {
	return format(parseISO(dateStr), "EEE");
}

// ── Month utilities ──────────────────────────────────────────────

/**
 * Get current month info
 * @returns Current year and month (1-indexed)
 */
export function getCurrentMonth(): { year: number; month: number } {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Get date range for a month (all days)
 * @param year Full year
 * @param month Month 1-12
 * @returns Array of ISO date strings (YYYY-MM-DD) for every day in the month
 */
export function getMonthDateRange(year: number, month: number): string[] {
	const start = startOfMonth(new Date(year, month - 1));
	const end = endOfMonth(start);
	return eachDayOfInterval({ start, end }).map((date) => format(date, "yyyy-MM-dd"));
}

/**
 * Navigate to previous/next month
 * @param year Current year
 * @param month Current month (1-12)
 * @param direction 1 for next, -1 for previous
 * @returns New year and month
 */
export function navigateMonth(
	year: number,
	month: number,
	direction: 1 | -1
): { year: number; month: number } {
	const date = addMonths(new Date(year, month - 1), direction);
	return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/**
 * Format a month label
 * @param year Full year
 * @param month Month 1-12
 * @returns Formatted string like "February 2026"
 */
export function formatMonthLabel(year: number, month: number): string {
	return format(new Date(year, month - 1), "MMMM yyyy");
}

// ── Year utilities ──────────────────────────────────────────────

/**
 * Get current year
 * @returns Current year number
 */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}

/**
 * Get all 12 months for a given year
 * @param year Full year
 * @returns Array of { year, month } for months 1-12
 */
export function getYearMonths(year: number): { year: number; month: number }[] {
	return Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
}

/**
 * Format a short month name
 * @param month Month 1-12
 * @returns Short month name (Jan, Feb, etc.)
 */
export function formatShortMonth(month: number): string {
	return format(new Date(2000, month - 1), "MMM");
}
