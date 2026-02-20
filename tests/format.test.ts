import { describe, it, expect } from "vitest";
import { formatKWh, formatPercent, formatNumber } from "$lib/utils/format";

describe("format", () => {
	describe("formatKWh", () => {
		it("should format kWh with default 0 decimals", () => {
			expect(formatKWh(123.456)).toBe("123 kWh");
			expect(formatKWh(10)).toBe("10 kWh");
			expect(formatKWh(7000)).toBe("7\u00A0000 kWh");
		});

		it("should format kWh with custom decimals", () => {
			expect(formatKWh(123.456, 1)).toBe("123.5 kWh");
			expect(formatKWh(123.456, 3)).toBe("123.456 kWh");
		});

		it("should handle zero and negative values", () => {
			expect(formatKWh(0)).toBe("0 kWh");
			expect(formatKWh(-10.5)).toBe("-11 kWh");
		});
	});

	describe("formatPercent", () => {
		it("should format positive percentages with + sign", () => {
			expect(formatPercent(12.5)).toBe("+12.5%");
			expect(formatPercent(0.123)).toBe("+0.1%");
		});

		it("should format negative percentages with - sign", () => {
			expect(formatPercent(-8.3)).toBe("-8.3%");
			expect(formatPercent(-0.456)).toBe("-0.5%");
		});

		it("should format zero without sign", () => {
			expect(formatPercent(0)).toBe("0.0%");
		});

		it("should round to 1 decimal place", () => {
			expect(formatPercent(12.567)).toBe("+12.6%");
			expect(formatPercent(-12.543)).toBe("-12.5%");
		});
	});

	describe("formatNumber", () => {
		it("should format numbers with default 0 decimals", () => {
			expect(formatNumber(1234)).toBe("1\u00A0234");
			expect(formatNumber(1234567)).toBe("1\u00A0234\u00A0567");
		});

		it("should format numbers with custom decimals", () => {
			expect(formatNumber(1234.567, 2)).toBe("1\u00A0234.57");
			expect(formatNumber(1234.5, 1)).toBe("1\u00A0234.5");
		});

		it("should handle small numbers without separators", () => {
			expect(formatNumber(123)).toBe("123");
			expect(formatNumber(12)).toBe("12");
		});

		it("should handle zero and negative values", () => {
			expect(formatNumber(0)).toBe("0");
			expect(formatNumber(-1234)).toBe("-1\u00A0234");
			expect(formatNumber(-1234.56, 2)).toBe("-1\u00A0234.56");
		});
	});
});
