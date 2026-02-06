const Database = require("better-sqlite3");
const fs = require("fs");

function parseConsumptionCSV(csvText) {
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

const db = new Database("local.db");

// Read and parse test data
const csvText = fs.readFileSync("test-data.csv", "utf-8");
const result = parseConsumptionCSV(csvText);

console.log("Parsed rows:", result.rows.length);

// Try inserting (simulate what the form action does)
let inserted = 0;
let skipped = 0;

const insertStmt = db.prepare(
	"INSERT OR IGNORE INTO consumption (timestamp, kwh) VALUES (?, ?)"
);

for (const row of result.rows) {
	const info = insertStmt.run(row.timestamp, row.kwh);
	if (info.changes > 0) {
		inserted++;
	} else {
		skipped++;
	}
}

console.log("✓ Inserted:", inserted);
console.log("✓ Skipped (duplicates):", skipped);

// Verify data in database
const count = db.prepare("SELECT COUNT(*) as count FROM consumption").get();
console.log("✓ Total records in database:", count.count);

// Show sample records
const samples = db.prepare("SELECT * FROM consumption ORDER BY timestamp LIMIT 3").all();
console.log("\nSample records:");
samples.forEach((row) => {
	console.log(`  ${row.timestamp} → ${row.kwh} kWh`);
});

db.close();
console.log("\n✓ Import test complete!");
