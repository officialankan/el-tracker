# Electricity Consumption Tracker — Project Plan

## Overview

A personal SvelteKit web app with a SQLite backend for tracking and analyzing household electricity consumption. The app runs locally (no auth needed) and allows importing hourly consumption data exported from a Swedish electricity provider. The focus is on powerful analysis and comparison features beyond what the provider's own dashboard offers.

**Assumption**: The SvelteKit project is already scaffolded with Drizzle ORM, Tailwind CSS, and shadcn-svelte installed and configured. This plan covers everything to build on top of that foundation.

---

## Tech Stack

- **Frontend**: SvelteKit (latest stable, SvelteKit 2 / Svelte 5)
- **Data loading**: SvelteKit server load functions (`+page.server.ts`)
- **Database**: SQLite via Drizzle ORM with `better-sqlite3` driver
- **Charts**: LayerChart (Svelte-native charting library)
- **UI components**: shadcn-svelte (Tailwind-based component library)
- **Styling**: Tailwind CSS

---

## Database Schema (Drizzle)

A single SQLite database file at a configurable path (default: `data/consumption.db`).

### Drizzle Schema Definition

```typescript
// src/lib/db/schema.ts
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const consumption = sqliteTable("consumption", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	timestamp: text("timestamp").notNull().unique(), // ISO 8601: "2026-02-04T00:00:00"
	kwh: real("kwh").notNull()
});

export const targets = sqliteTable("targets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	periodType: text("period_type").notNull(), // 'daily' | 'weekly' | 'monthly' | 'yearly'
	kwhTarget: real("kwh_target").notNull(),
	validFrom: text("valid_from").notNull() // ISO 8601 date: "2026-02-01"
});
```

### Notes

- `timestamp` has a unique constraint to prevent duplicate imports.
- Timestamps are stored in local Swedish time (no timezone conversion — source data is already local).
- Targets are versioned with `valid_from` so they can be adjusted over time. When displaying, use the most recent target where `valid_from <= current_date` for each period type.

### Database Connection

```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("data/consumption.db");
export const db = drizzle(sqlite, { schema });
```

Use `drizzle-kit` for migrations (`drizzle-kit generate` + `drizzle-kit migrate`).

---

## CSV Import Format

The provider exports CSVs (actually TSV) with this structure:

```
Datum	El kWh
2026-02-04 00:00 (ons)	4,472
2026-02-04 01:00 (ons)	4,19
2026-02-04 02:00 (ons)	4,069
```

### Parsing Rules

1. **Delimiter**: Tab-separated (`\t`)
2. **Header**: First row is `Datum\tEl kWh` — skip it
3. **Timestamp column**: Format is `YYYY-MM-DD HH:MM (day_abbrev)` — parse only the first 16 characters (`YYYY-MM-DD HH:MM`), ignore the parenthesized day abbreviation
4. **Value column**: Swedish decimal format uses comma as decimal separator — replace `,` with `.` before parsing as float
5. **Empty/missing values**: Skip rows where the kWh value is empty or unparseable
6. **Convert timestamp to ISO**: `"YYYY-MM-DDTHH:MM:00"`

### Import Behavior

- Parse the uploaded file server-side in a form action
- For each row, attempt to INSERT into `consumption`
- On duplicate `timestamp`, **skip** that row (use Drizzle's `onConflictDoNothing()`)
- After import, return a summary: `{ inserted, skipped, errors, dateRange }`
- Show the summary to the user with details on skipped/error rows if any

---

## Consistent View Architecture

All three time-scale views (weekly, monthly, yearly) follow the **same structural pattern**:

**Note**: The daily view was skipped because we have daily totals (not hourly data), so showing a single value per day isn't useful. Weekly view is the primary analysis page.

### Shared Structure Per View

1. **Period selector** — pick the specific period to view (date picker, week picker, month picker, year picker)
2. **Navigation arrows** — previous/next period
3. **Main chart** — bar chart showing consumption broken down by the sub-unit:
   - Weekly → 7 daily bars (Mon–Sun)
   - Monthly → daily bars (1–28/31)
   - Yearly → 12 monthly bars (Jan–Dec)
4. **Comparison overlay** — pick a second period of the same type to overlay on the chart (secondary color, lower opacity)
5. **Stats card** with consistent metrics:
   - **Total kWh** for the period
   - **Average** per sub-unit (e.g. avg per hour for daily, avg per day for weekly)
   - **Peak** sub-unit (highest consuming hour/day/month)
   - **vs. Target** — actual vs. active target, difference (absolute + %), color indicator (green = under, red = over)
   - **vs. Rolling average** — actual vs. rolling average of recent periods (see below)
   - **vs. Previous period** — percent change from immediately preceding period
   - **Projection** (current/incomplete periods only) — `(actual_so_far / sub_units_elapsed) * total_sub_units`

### Rolling Average Definitions

| View    | Rolling average                                       |
| ------- | ----------------------------------------------------- |
| Weekly  | Average weekly total over the last 4 complete weeks   |
| Monthly | Average monthly total over the last 3 complete months |
| Yearly  | Average yearly total over all complete previous years |

---

## Pages & Routes

### 1. `/` — Home

A simple landing page with navigation to all sections. Can optionally show a compact summary card (current month's consumption, target status) but keep it minimal.

### 2. `/import` — Data Import

- **File upload** input (accepts `.csv`, `.txt`)
- Uses a SvelteKit form action (`+page.server.ts` `actions`) to handle the upload server-side
- After import, display results via the action's return data: rows inserted, skipped (duplicates), errors
- Show the date range of the imported data
- Optionally show a preview of the first ~10 parsed rows before confirming (can be a progressive enhancement)

### 3. `/weekly` — Weekly Analysis (Primary View)

- Period selector: week picker (year + ISO week number)
- Chart: daily bar chart (Mon–Sun)
- Comparison: overlay another week
- Stats card with all standard metrics
- URL param: `?year=2026&week=6`

### 4. `/monthly` — Monthly Analysis

- Period selector: month picker (year + month)
- Chart: daily bar chart across the month
- Comparison: overlay another month
- Stats card with all standard metrics + projection if current month
- URL param: `?year=2026&month=2&compare_year=2026&compare_month=1`

### 5. `/yearly` — Yearly Analysis

- Period selector: year picker
- Chart: monthly bar chart (Jan–Dec)
- Comparison: overlay another year
- Stats card with all standard metrics + projection if current year
- URL param: `?year=2026&compare=2025`

### 6. `/patterns` — Consumption Patterns

Multiple analysis sections on one page:

- **Day-of-week pattern**: Average consumption by day of week (Mon–Sun), aggregated across all data. Bar chart.
- **Hour-of-day pattern**: *(Skip this — we don't have hourly data, only daily totals)*
- **Month-of-year pattern**: Average total monthly consumption by month. Bar chart (grows more useful as data accumulates).
- **Heatmap**: Calendar-style heatmap showing daily total consumption, color-coded from low to high. Shows a selectable date range (default: last 3 months).

### 7. `/targets` — Target Management

- Forms to set/update targets for each period type (daily, weekly, monthly, yearly)
- Uses form actions for create/update
- Displays current active targets in a card layout
- History table of previous targets with their `valid_from` dates
- Ability to set a new target effective from a chosen date

---

## Data Loading with `+page.server.ts`

All data fetching happens in SvelteKit `load` functions. No separate API routes needed.

### Example: `/daily/+page.server.ts`

```typescript
import type { PageServerLoad } from "./$types";
import { db } from "$lib/db";
import { consumption, targets } from "$lib/db/schema";
import { and, gte, lt, eq, desc, lte } from "drizzle-orm";

export const load: PageServerLoad = async ({ url }) => {
	const date = url.searchParams.get("date") ?? getMostRecentDateWithData();
	const compareDate = url.searchParams.get("compare") ?? null;

	const startOfDay = `${date}T00:00:00`;
	const startOfNextDay = `${getNextDay(date)}T00:00:00`;

	const hours = await db
		.select()
		.from(consumption)
		.where(and(gte(consumption.timestamp, startOfDay), lt(consumption.timestamp, startOfNextDay)))
		.orderBy(consumption.timestamp);

	// Fetch comparison day if selected
	let comparisonHours = null;
	if (compareDate) {
		// ... same query pattern with compareDate
	}

	// Fetch active daily target
	const dailyTarget = await db
		.select()
		.from(targets)
		.where(and(eq(targets.periodType, "daily"), lte(targets.validFrom, date)))
		.orderBy(desc(targets.validFrom))
		.limit(1);

	// Compute rolling 7-day average
	// ... aggregation query

	return {
		date,
		hours,
		comparisonHours,
		target: dailyTarget[0] ?? null,
		rollingAverage,
		stats: { total, average, peak, previousPeriod, projection }
	};
};
```

The same pattern applies to weekly, monthly, and yearly pages — only the date range logic and aggregation granularity change.

### Import Page: `/import/+page.server.ts`

```typescript
import type { Actions } from "./$types";
import { db } from "$lib/db";
import { consumption } from "$lib/db/schema";
import { parseCSV } from "$lib/utils/csv-parser";

export const actions: Actions = {
	upload: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const text = await file.text();
		const rows = parseCSV(text);

		let inserted = 0;
		let skipped = 0;
		let errors = 0;

		for (const row of rows) {
			try {
				const result = await db
					.insert(consumption)
					.values({ timestamp: row.timestamp, kwh: row.kwh })
					.onConflictDoNothing();

				if (result.changes > 0) inserted++;
				else skipped++;
			} catch {
				errors++;
			}
		}

		return {
			success: true,
			inserted,
			skipped,
			errors,
			dateRange: { from: rows[0]?.timestamp, to: rows.at(-1)?.timestamp }
		};
	}
};
```

---

## Component Structure

```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts              # Drizzle connection setup
│   │   ├── schema.ts             # Drizzle table definitions
│   │   └── queries/
│   │       ├── consumption.ts    # Reusable consumption query helpers
│   │       ├── targets.ts        # Target query helpers
│   │       └── stats.ts          # Rolling averages, aggregations
│   ├── utils/
│   │   ├── csv-parser.ts         # CSV/TSV parsing logic
│   │   ├── date-utils.ts         # Date formatting, ISO week helpers, period math
│   │   └── format.ts             # Number formatting (kWh display, percentages)
│   └── components/
│       ├── charts/
│       │   ├── ConsumptionBarChart.svelte    # Reusable bar chart (used by all views)
│       │   ├── PatternChart.svelte           # For pattern analysis charts
│       │   └── Heatmap.svelte                # Calendar heatmap
│       ├── StatsCard.svelte                  # Reusable stats summary (used by all views)
│       ├── TargetIndicator.svelte            # Over/under target visual
│       ├── PeriodNavigation.svelte           # Previous/next arrows + period selector
│       ├── ComparisonSelector.svelte         # Pick a comparison period
│       └── ImportResults.svelte              # Import summary display
├── routes/
│   ├── +layout.svelte                        # App shell with sidebar navigation
│   ├── +page.svelte                          # Home
│   ├── import/
│   │   ├── +page.svelte
│   │   └── +page.server.ts                   # Form action for file upload
│   ├── daily/
│   │   ├── +page.svelte
│   │   └── +page.server.ts                   # Load hourly data, stats, target
│   ├── weekly/
│   │   ├── +page.svelte
│   │   └── +page.server.ts                   # Load daily data for week
│   ├── monthly/
│   │   ├── +page.svelte
│   │   └── +page.server.ts                   # Load daily data for month
│   ├── yearly/
│   │   ├── +page.svelte
│   │   └── +page.server.ts                   # Load monthly data for year
│   ├── patterns/
│   │   ├── +page.svelte
│   │   └── +page.server.ts                   # Load all pattern aggregations
│   └── targets/
│       ├── +page.svelte
│       └── +page.server.ts                   # Load targets + form actions
```

---

## Key Implementation Notes

### Reusable Chart Component

Since all four views use the same chart type (bar chart with optional comparison overlay), build a single `ConsumptionBarChart.svelte` that accepts:

```typescript
interface ChartProps {
	labels: string[]; // X-axis labels (hours, days, months)
	data: number[]; // Primary dataset values
	comparisonData?: number[]; // Optional overlay dataset
	comparisonLabel?: string; // Label for comparison (e.g. "Feb 3")
	targetLine?: number; // Horizontal target reference line
	xLabel?: string; // X-axis title
	yLabel?: string; // Y-axis title (default: "kWh")
}
```

### Reusable Stats Card

Build a single `StatsCard.svelte` used by all views:

```typescript
interface StatsProps {
	total: number;
	average: number;
	peak: { label: string; value: number };
	target: { value: number; validFrom: string } | null;
	rollingAverage: number | null;
	previousPeriod: { total: number; percentChange: number } | null;
	projection: number | null; // Only for current/incomplete periods
	periodLabel: string; // e.g. "today", "this week", "February 2026"
}
```

### Target Display on Charts

- Render the active target as a **horizontal reference line** on the main chart using LayerChart's built-in reference line features
- Color the total in the stats card: green if under target, red if over

### Comparison Overlay

- When a comparison period is selected, update the URL search param (e.g. `?date=2026-02-04&compare=2026-02-03`)
- The `+page.server.ts` load function fetches both datasets
- Chart renders comparison data with a lighter color and lower opacity
- Stats card can optionally show a diff between the two periods

### Heatmap on Patterns Page

Build a **custom Svelte component using CSS grid** — simpler than a canvas approach and gives full control over styling with Tailwind.

The heatmap should look like a GitHub contribution graph: a grid of small colored squares, one per day, arranged in columns by week. Color scale from light (low consumption) to dark (high consumption).

### URL-Driven State

All view pages derive their state from URL search params. This makes navigation, bookmarking, and the browser back button work naturally:

- `/daily?date=2026-02-04&compare=2026-02-03`
- `/weekly?year=2026&week=6`
- `/monthly?year=2026&month=2&compare_year=2026&compare_month=1`
- `/yearly?year=2026&compare=2025`

The `+page.server.ts` load functions read from `url.searchParams`. Period navigation and comparison selectors update the URL via `goto()` or anchor links.

---

## Implementation Order (Suggested)

1. **Database layer**: Drizzle schema, connection, run initial migration ✅
2. **CSV parser**: `csv-parser.ts` utility with tests against the known format ✅
3. **Import page**: File upload form action + results display ✅
4. **Weekly view**: Bar chart + stats card + period navigation (PRIMARY VIEW)
5. **Monthly view**: Reuse chart/stats components with monthly aggregation + projection
6. **Yearly view**: Same pattern, yearly aggregation + projection
7. **Comparison overlays**: Add comparison selector and overlay to all three views
8. **Targets page**: CRUD for targets + form actions
9. **Target integration**: Add target lines and indicators to all view stats cards/charts
10. **Patterns page**: Day-of-week, month-of-year charts + heatmap
11. **Polish**: Loading states, empty states, error handling, responsive layout

---

## Future Enhancements (Out of Scope for Now)

- Electricity price data integration (spot prices per hour, cost tracking)
- Data export functionality
- Temperature correlation (fetch weather data to correlate with consumption)
- Anomaly detection (flag unusual consumption days)
- Dark mode
