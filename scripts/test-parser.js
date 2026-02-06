import fs from "fs";
import { parseConsumptionCSV } from "../src/lib/utils/csv-parser.js";

const csvText = fs.readFileSync("test-data.csv", "utf-8");
const result = parseConsumptionCSV(csvText);

console.log("✓ Parsed rows:", result.rows.length);
console.log("\nFirst 3 rows:");
result.rows.slice(0, 3).forEach((row) => {
	console.log(`  ${row.timestamp} → ${row.kwh} kWh`);
});

if (result.errors.length > 0) {
	console.log("\n⚠ Errors:");
	result.errors.forEach((err) => {
		console.log(`  Line ${err.line}: ${err.error}`);
	});
} else {
	console.log("\n✓ No errors");
}
