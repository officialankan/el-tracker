import { describe, it, expect } from "vitest";
import { findDateGaps } from "$lib/utils/gaps";

describe("findDateGaps", () => {
	it("returns empty array for empty input", () => {
		expect(findDateGaps([])).toEqual([]);
	});

	it("returns empty array for single date", () => {
		expect(findDateGaps(["2026-01-01"])).toEqual([]);
	});

	it("returns empty array for two consecutive dates", () => {
		expect(findDateGaps(["2026-01-01", "2026-01-02"])).toEqual([]);
	});

	it("returns one 1-day gap for two dates 2 days apart", () => {
		expect(findDateGaps(["2026-01-01", "2026-01-03"])).toEqual([
			{ start: "2026-01-02", end: "2026-01-02", days: 1 }
		]);
	});

	it("returns one 2-day gap for two dates 3 days apart", () => {
		expect(findDateGaps(["2026-01-01", "2026-01-04"])).toEqual([
			{ start: "2026-01-02", end: "2026-01-03", days: 2 }
		]);
	});

	it("handles multiple gaps in one sequence", () => {
		const dates = ["2026-01-01", "2026-01-03", "2026-01-07", "2026-01-09"];
		expect(findDateGaps(dates)).toEqual([
			{ start: "2026-01-02", end: "2026-01-02", days: 1 },
			{ start: "2026-01-04", end: "2026-01-06", days: 3 },
			{ start: "2026-01-08", end: "2026-01-08", days: 1 }
		]);
	});

	it("start equals end for single-day gaps", () => {
		const result = findDateGaps(["2026-01-10", "2026-01-12"]);
		expect(result[0].start).toBe(result[0].end);
	});

	it("handles gaps spanning a year boundary", () => {
		expect(findDateGaps(["2025-12-31", "2026-01-02"])).toEqual([
			{ start: "2026-01-01", end: "2026-01-01", days: 1 }
		]);
	});
});
