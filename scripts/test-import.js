import Database from "better-sqlite3";
import fs from "fs";
import { parseConsumptionCSV } from "../src/lib/utils/csv-parser.js";

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
