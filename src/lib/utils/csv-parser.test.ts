import { describe, it, expect } from "vitest";
import { parseConsumptionCSV } from "./csv-parser";

describe("parseConsumptionCSV", () => {
	it("should parse valid CSV data", () => {
		const csv = `"Datum";"El kWh"
"2026-01-29";"101,009"
"2026-01-30";"96,59"
"2026-01-31";"109,814"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(3);
		expect(result.errors).toHaveLength(0);

		expect(result.rows[0]).toEqual({
			timestamp: "2026-01-29T00:00:00",
			kwh: 101.009
		});

		expect(result.rows[1]).toEqual({
			timestamp: "2026-01-30T00:00:00",
			kwh: 96.59
		});

		expect(result.rows[2]).toEqual({
			timestamp: "2026-01-31T00:00:00",
			kwh: 109.814
		});
	});

	it("should handle BOM character", () => {
		const csv = `\uFEFF"Datum";"El kWh"
"2026-01-29";"101,009"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].timestamp).toBe("2026-01-29T00:00:00");
	});

	it("should convert Swedish decimal format", () => {
		const csv = `"Datum";"El kWh"
"2026-01-29";"101,009"
"2026-01-30";"96,59"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows[0].kwh).toBe(101.009);
		expect(result.rows[1].kwh).toBe(96.59);
	});

	it("should skip empty lines", () => {
		const csv = `"Datum";"El kWh"
"2026-01-29";"101,009"

"2026-01-30";"96,59"

`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(2);
	});

	it("should handle invalid date format", () => {
		const csv = `"Datum";"El kWh"
"invalid-date";"101,009"
"2026-01-30";"96,59"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(1);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].line).toBe(2);
		expect(result.errors[0].error).toContain("Invalid date format");
	});

	it("should handle invalid kWh value", () => {
		const csv = `"Datum";"El kWh"
"2026-01-29";"not-a-number"
"2026-01-30";"96,59"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(1);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].line).toBe(2);
		expect(result.errors[0].error).toContain("Invalid kWh value");
	});

	it("should handle insufficient fields", () => {
		const csv = `"Datum";"El kWh"
"2026-01-29"
"2026-01-30";"96,59"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(1);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].error).toContain("Invalid format");
	});

	it("should handle zero values", () => {
		const csv = `"Datum";"El kWh"
"2026-02-06";"0,000"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].kwh).toBe(0);
	});

	it("should create ISO 8601 timestamps at midnight", () => {
		const csv = `"Datum";"El kWh"
"2026-01-29";"101,009"`;

		const result = parseConsumptionCSV(csv);

		expect(result.rows[0].timestamp).toBe("2026-01-29T00:00:00");
	});
});
