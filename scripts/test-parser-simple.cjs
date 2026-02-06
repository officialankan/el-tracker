const fs = require("fs");

function parseCSV(csvText) {
	const rows = [];
	const errors = [];
	const text = csvText.replace(/^\uFEFF/, "");
	const lines = text.split("\n").map((l) => l.trim());

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		try {
			const fields = line.split(";").map((f) => f.replace(/^"(.*)"$/, "$1"));

			if (fields.length < 2) {
				errors.push({ line: i + 1, error: "Invalid format" });
				continue;
			}

			const dateStr = fields[0].trim();
			const kwhStr = fields[1].trim();
			const kwh = parseFloat(kwhStr.replace(",", "."));
			const timestamp = `${dateStr}T00:00:00`;

			if (!isNaN(kwh)) {
				rows.push({ timestamp, kwh });
			}
		} catch (error) {
			errors.push({ line: i + 1, error: error.message });
		}
	}

	return { rows, errors };
}

const text = fs.readFileSync("test-data.csv", "utf-8");
const result = parseCSV(text);

console.log("✓ Parsed rows:", result.rows.length);
console.log("\nFirst 3 rows:");
result.rows.slice(0, 3).forEach((row) => {
	console.log(`  ${row.timestamp} → ${row.kwh} kWh`);
});

console.log("\nLast row:");
console.log(
	`  ${result.rows[result.rows.length - 1].timestamp} → ${result.rows[result.rows.length - 1].kwh} kWh`
);

if (result.errors.length > 0) {
	console.log("\n⚠ Errors:", result.errors.length);
} else {
	console.log("\n✓ No errors");
}
