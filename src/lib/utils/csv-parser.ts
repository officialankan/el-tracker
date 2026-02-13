import type { ResourceType } from "$lib/resource";

export interface ConsumptionRow {
	timestamp: string;
	kwh: number;
}

export interface ParseResult {
	rows: ConsumptionRow[];
	errors: Array<{ line: number; error: string }>;
	resourceType: ResourceType;
}

/**
 * Detect resource type from header line
 */
function detectResourceType(headerLine: string): ResourceType {
	if (/vatten/i.test(headerLine)) return "water";
	return "el";
}

/**
 * Parse a numeric value, handling Swedish formatting.
 * Water values use space as thousands separator (e.g. "1 000").
 * Electricity values use comma as decimal separator (e.g. "101,009").
 */
function parseValue(raw: string, resourceType: ResourceType): number {
	let cleaned = raw.trim();
	if (resourceType === "water") {
		// Remove space-as-thousands-separator, then handle comma decimal
		cleaned = cleaned.replace(/\s/g, "").replace(",", ".");
	} else {
		cleaned = cleaned.replace(",", ".");
	}
	return parseFloat(cleaned);
}

/**
 * Parses Swedish electricity provider CSV exports
 * Format: semicolon-separated, quoted fields, Swedish decimals (comma)
 * Example: "2026-01-29";"101,009"
 */
export function parseConsumptionCSV(csvText: string): ParseResult {
	const rows: ConsumptionRow[] = [];
	const errors: Array<{ line: number; error: string }> = [];

	// Remove BOM if present
	const text = csvText.replace(/^\uFEFF/, "");

	const lines = text.split("\n").map((line) => line.trim());

	const resourceType = lines.length > 0 ? detectResourceType(lines[0]) : "el";
	const unit = resourceType === "water" ? "L" : "kWh";

	// Skip header row and empty lines
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		try {
			// Parse semicolon-separated quoted fields
			const fields = line.split(";").map((field) => field.replace(/^"(.*)"$/, "$1"));

			if (fields.length < 2) {
				errors.push({ line: i + 1, error: "Invalid format: expected 2 fields" });
				continue;
			}

			const dateStr = fields[0].trim();
			const valueStr = fields[1].trim();

			// Validate date format (YYYY-MM-DD)
			if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
				errors.push({ line: i + 1, error: `Invalid date format: ${dateStr}` });
				continue;
			}

			const kwh = parseValue(valueStr, resourceType);

			if (isNaN(kwh)) {
				errors.push({ line: i + 1, error: `Invalid ${unit} value: ${valueStr}` });
				continue;
			}

			// Convert to ISO 8601 timestamp (midnight for daily data)
			const timestamp = `${dateStr}T00:00:00`;

			rows.push({ timestamp, kwh });
		} catch (error) {
			errors.push({
				line: i + 1,
				error: error instanceof Error ? error.message : "Unknown error"
			});
		}
	}

	return { rows, errors, resourceType };
}

/**
 * Parses pasted electricity consumption text
 * Format: tab-separated, date with day name suffix, Swedish decimals
 * Example: 2026-02-02 (måndag)	101,895
 */
export function parsePastedConsumption(text: string): ParseResult {
	const rows: ConsumptionRow[] = [];
	const errors: Array<{ line: number; error: string }> = [];

	const lines = text.split("\n").map((line) => line.trim());

	const resourceType = lines.length > 0 ? detectResourceType(lines[0]) : "el";
	const unit = resourceType === "water" ? "L" : "kWh";

	// Skip header row and empty lines
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		try {
			const fields = line.split("\t");

			if (fields.length < 2) {
				errors.push({ line: i + 1, error: "Invalid format: expected 2 tab-separated fields" });
				continue;
			}

			// Extract YYYY-MM-DD from "2026-02-02 (måndag)"
			const dateStr = fields[0].trim().substring(0, 10);

			if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
				errors.push({ line: i + 1, error: `Invalid date format: ${dateStr}` });
				continue;
			}

			const kwh = parseValue(fields[1], resourceType);

			if (isNaN(kwh)) {
				errors.push({ line: i + 1, error: `Invalid ${unit} value: ${fields[1].trim()}` });
				continue;
			}

			const timestamp = `${dateStr}T00:00:00`;
			rows.push({ timestamp, kwh });
		} catch (error) {
			errors.push({
				line: i + 1,
				error: error instanceof Error ? error.message : "Unknown error"
			});
		}
	}

	return { rows, errors, resourceType };
}
