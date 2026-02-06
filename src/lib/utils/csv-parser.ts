export interface ConsumptionRow {
	timestamp: string;
	kwh: number;
}

export interface ParseResult {
	rows: ConsumptionRow[];
	errors: Array<{ line: number; error: string }>;
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
			const kwhStr = fields[1].trim();

			// Validate date format (YYYY-MM-DD)
			if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
				errors.push({ line: i + 1, error: `Invalid date format: ${dateStr}` });
				continue;
			}

			// Convert Swedish decimal (comma) to dot and parse
			const kwh = parseFloat(kwhStr.replace(",", "."));

			if (isNaN(kwh)) {
				errors.push({ line: i + 1, error: `Invalid kWh value: ${kwhStr}` });
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

	return { rows, errors };
}
