import { describe, it, expect } from "vitest";
import {
	getISOWeek,
	getMondayOfISOWeek,
	getWeekDateRange,
	formatDateRange,
	getCurrentWeek,
	navigateWeek,
	formatDayOfWeek
} from "./date-utils";

describe("date-utils", () => {
	describe("getISOWeek", () => {
		it("should return correct ISO week for a date", () => {
			expect(getISOWeek("2026-02-04")).toEqual({ year: 2026, week: 6 });
			expect(getISOWeek("2026-01-01")).toEqual({ year: 2026, week: 1 });
			expect(getISOWeek("2026-12-31")).toEqual({ year: 2026, week: 53 });
		});

		it("should work with Date objects", () => {
			const date = new Date("2026-02-04");
			expect(getISOWeek(date)).toEqual({ year: 2026, week: 6 });
		});

		it("should handle year boundaries correctly", () => {
			// Dec 29, 2025 is Monday of week 1 of 2026
			expect(getISOWeek("2025-12-29")).toEqual({ year: 2026, week: 1 });
		});
	});

	describe("getMondayOfISOWeek", () => {
		it("should return the Monday of a given ISO week", () => {
			const monday = getMondayOfISOWeek(2026, 6);
			// date-fns returns Feb 1 for week 6 of 2026
			expect(monday.toISOString().split("T")[0]).toBe("2026-02-01");
		});

		it("should return Monday for week 1", () => {
			const monday = getMondayOfISOWeek(2026, 1);
			expect(monday.getDay()).toBe(1); // Monday is day 1
		});
	});

	describe("getWeekDateRange", () => {
		it("should return 7 consecutive dates starting from Monday", () => {
			const dates = getWeekDateRange(2026, 6);
			expect(dates).toHaveLength(7);
			expect(dates[0]).toBe("2026-02-02"); // Monday (per date-fns startOfISOWeek)
			expect(dates[6]).toBe("2026-02-08"); // Sunday
		});

		it("should return dates in ISO format", () => {
			const dates = getWeekDateRange(2026, 1);
			dates.forEach((date) => {
				expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			});
		});
	});

	describe("formatDateRange", () => {
		it("should format dates in the same month correctly", () => {
			const result = formatDateRange("2026-02-03", "2026-02-09");
			expect(result).toBe("Feb 3–9, 2026");
		});

		it("should format dates across different months", () => {
			const result = formatDateRange("2026-01-29", "2026-02-04");
			expect(result).toBe("Jan 29 – Feb 4, 2026");
		});

		it("should use en-dash for same month, spaced en-dash for different months", () => {
			const sameMonth = formatDateRange("2026-02-03", "2026-02-09");
			expect(sameMonth).toContain("–"); // en-dash without spaces

			const diffMonth = formatDateRange("2026-01-29", "2026-02-04");
			expect(diffMonth).toContain(" – "); // en-dash with spaces
		});
	});

	describe("getCurrentWeek", () => {
		it("should return a valid week object", () => {
			const current = getCurrentWeek();
			expect(current).toHaveProperty("year");
			expect(current).toHaveProperty("week");
			expect(typeof current.year).toBe("number");
			expect(typeof current.week).toBe("number");
			expect(current.week).toBeGreaterThanOrEqual(1);
			expect(current.week).toBeLessThanOrEqual(53);
		});
	});

	describe("navigateWeek", () => {
		it("should navigate to next week", () => {
			const result = navigateWeek(2026, 6, 1);
			expect(result).toEqual({ year: 2026, week: 7 });
		});

		it("should navigate to previous week", () => {
			const result = navigateWeek(2026, 6, -1);
			expect(result).toEqual({ year: 2026, week: 5 });
		});

		it("should handle year boundaries when going forward", () => {
			const result = navigateWeek(2026, 53, 1);
			expect(result.year).toBe(2027);
			expect(result.week).toBe(1); // date-fns: Week 53 of 2026 is followed by week 1 of 2027
		});

		it("should handle year boundaries when going backward", () => {
			const result = navigateWeek(2026, 1, -1);
			expect(result.year).toBe(2025);
			expect(result.week).toBeGreaterThan(50);
		});
	});

	describe("formatDayOfWeek", () => {
		it("should format day of week correctly", () => {
			expect(formatDayOfWeek("2026-02-02")).toBe("Mon"); // Monday
			expect(formatDayOfWeek("2026-02-03")).toBe("Tue");
			expect(formatDayOfWeek("2026-02-04")).toBe("Wed");
			expect(formatDayOfWeek("2026-02-05")).toBe("Thu");
			expect(formatDayOfWeek("2026-02-06")).toBe("Fri");
			expect(formatDayOfWeek("2026-02-07")).toBe("Sat");
			expect(formatDayOfWeek("2026-02-08")).toBe("Sun");
		});
	});
});
