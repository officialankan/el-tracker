# Implementation Progress

Last updated: 2026-02-11

## Completed Phases ✅

### Phase 1: Database Layer ✅

- [x] Updated schema with `consumption` and `targets` tables
- [x] Removed placeholder `user` table
- [x] Generated and applied migrations
- [x] Database successfully created at `local.db`

### Phase 2: CSV Parser ✅

- [x] Created `src/lib/utils/csv-parser.ts`
- [x] Handles semicolon-separated format (actual data format, not the tab-separated from original plan)
- [x] Removes BOM character
- [x] Converts Swedish decimal format (comma → dot)
- [x] Creates ISO 8601 timestamps
- [x] Returns parse results with errors array

### Phase 3: Import Page ✅

- [x] Created `/import` route with file upload form
- [x] Implemented server-side form action in `+page.server.ts`
- [x] Integrated CSV parser with database
- [x] Duplicate handling with `onConflictDoNothing()`
- [x] Results display showing inserted/skipped/errors
- [x] Added navigation link from home page
- [x] **Bonus:** Set up Vitest with 9 passing tests for CSV parser

### Phase 4: Weekly View ✅

**Decision**: Skipped daily view since we have daily totals (not hourly data). Weekly view is the primary analysis page.

**Chart Library**: Using LayerChart 2.0 (next) with shadcn-svelte styling for Svelte 5 compatibility.

**Date Library**: Using date-fns for reliable ISO week calculations instead of custom implementations.

- [x] Installed LayerChart 2.0 (next) and d3-scale for categorical scales
- [x] Installed shadcn-svelte components (button, card, chart)
- [x] Installed date-fns for reliable date handling
- [x] Created date utility functions (`src/lib/utils/date-utils.ts`) with full test coverage
- [x] Created format utility functions (`src/lib/utils/format.ts`) with tests
- [x] Created `/weekly` route with `+page.server.ts` load function
  - [x] Fetch weekly consumption data (7 days)
  - [x] Fetch previous week data with daily breakdown for comparison
  - [x] Calculate stats (total, average, peak day) excluding null values
  - [x] Handle URL params for week selection
  - [x] Calculate rolling 4-week average
  - [x] Previous week comparison with % change
- [x] Created reusable `ConsumptionBarChart.svelte` component using LayerChart 2.0
  - [x] Grouped bars for current vs previous week comparison
  - [x] Visual hierarchy (current week uses chart-1 color, previous uses muted)
  - [x] Proper null value handling (null = no data, 0 = zero consumption)
  - [x] Stable tooltip with band mode
  - [x] Client-side only rendering with browser check
- [x] Created reusable `StatsCard.svelte` component using shadcn card
- [x] Added period navigation (prev/next week arrows + "Current Week" button)
- [x] Updated home page with navigation cards
- [x] All components validated with svelte-autofixer
- [x] All tests passing (36 tests total)

### Phase 5: Monthly View ✅

- [x] Added month utility functions to `date-utils.ts` (getCurrentMonth, getMonthDateRange, navigateMonth, formatMonthLabel)
- [x] Created `/monthly` route with `+page.server.ts` load function
  - [x] Fetch monthly consumption data (daily values for all days in month)
  - [x] Calculate stats (total, average, peak day)
  - [x] Handle URL params for month selection (`?year=X&month=Y`)
  - [x] Calculate rolling 3-month average (excluding current month)
  - [x] Previous month comparison with daily breakdown and % change
  - [x] Projection for incomplete months: `(total / daysWithData) * totalDaysInMonth`
- [x] Reused `ConsumptionBarChart.svelte` and `StatsCard.svelte` components
- [x] Added month navigation (prev/next arrows + "Current Month" button)
- [x] Updated NavBar with monthly link
- [x] Updated home page with monthly analysis card
- [x] Fixed `ConsumptionBarChart` props to accept `(number | null)[]` (was `number[]`)

### Phase 6: Yearly View ✅

- [x] Added year utility functions to `date-utils.ts` (getCurrentYear, getYearMonths, formatShortMonth)
- [x] Created `/yearly` route with `+page.server.ts` load function
  - [x] Fetch yearly consumption data (monthly totals for all 12 months)
  - [x] Calculate stats (total, average per month, peak month)
  - [x] Handle URL params for year selection (`?year=X`)
  - [x] Calculate rolling 3-year average (excluding current year)
  - [x] Previous year comparison with monthly breakdown and % change
  - [x] Projection for incomplete years: `(total / monthsWithData) * 12`
- [x] Reused `ConsumptionBarChart.svelte` and `StatsCard.svelte` components with `subUnitLabel="month"`
- [x] Added year navigation (prev/next arrows + "Current Year" button)
- [x] Updated NavBar with yearly link
- [x] Updated home page with yearly analysis card

### Phase 7: Comparison Overlays ✅

- [x] Created reusable `ComparisonSelector.svelte` component
  - [x] Mode-aware inputs: year/week picker, year/month picker, or year-only picker
  - [x] Toggle between default (previous period) and custom comparison
  - [x] URL-driven via `<a>` navigation (same pattern as nav arrows)
  - [x] Writable `$derived` for input state, proper a11y labels
- [x] Updated weekly view to support custom comparison
  - [x] URL params: `?year=X&week=Y&compare_year=X&compare_week=Y`
  - [x] Defaults to previous week when no compare params
  - [x] Stats (percentChange, previousTotal) always use actual previous week
- [x] Updated monthly view to support custom comparison
  - [x] URL params: `?year=X&month=Y&compare_year=X&compare_month=Y`
  - [x] X-axis extends to the longer month when comparing months of different lengths
  - [x] Both data arrays null-padded to match
- [x] Updated yearly view to support custom comparison
  - [x] URL params: `?year=X&compare=Y`
- [x] Dynamic comparison labels (e.g., "Week 4, 2026" instead of always "Previous Week")

### Phase 8: Targets Page ✅

- [x] Installed shadcn-svelte components: input, label, select, table, separator
- [x] Created `/targets` route with `+page.server.ts`
  - [x] Load function: queries active target per period type (most recent `valid_from <= today`) and all targets for history
  - [x] `create` action: validates periodType, kwhTarget, validFrom, inserts into DB
  - [x] `delete` action: deletes target by id
- [x] Created `+page.svelte` with full CRUD UI
  - [x] Header with Target lucide icon
  - [x] 2x2 active targets card grid (daily/weekly/monthly/yearly) with kWh + valid from, or "No target set"
  - [x] New target form with Select (period type), Input (kWh), date Input (valid from), using `use:enhance`
  - [x] Target history table with period type, kWh, valid from, active/inactive badge, delete button
- [x] Simplified NavBar: replaced hover-dropdown NavigationMenu with inline horizontal Button links
  - [x] Active-page highlighting via `page.url.pathname`
  - [x] Logo link to home page
- [x] Added Targets card to home page

### Phase 9: Target Integration ✅

- [x] Server load functions query active target for each period type
  - `weekly/+page.server.ts`: queries `targets` where `periodType="weekly"` and `validFrom <= today`
  - `monthly/+page.server.ts`: same for `"monthly"`
  - `yearly/+page.server.ts`: same for `"yearly"`
  - All return `target: { value, validFrom } | null`
- [x] Page components pass target data to child components
  - All three views pass `target={data.target}` to `<StatsCard>`
  - All three views pass `targetLine={data.target?.value}` to `<ConsumptionBarChart>`
- [x] StatsCard "vs. Target" stat row works (green/red indicator, already had the UI — now wired)
- [x] Cumulative progress area overlay in `ConsumptionBarChart.svelte`
  - Uses LayerChart `<Area y1="cumulative">` to show cumulative kWh building up
  - Stops at last day/month with data (cumulative set to `null` for missing data)
  - Tooltip shows "Cumulative" value (rounded to whole number) on hover
  - `maxValue` / `yDomain` scaled to fit both bars and cumulative total
- [x] Target horizontal dashed line
  - Created custom `TargetLine.svelte` component using `getChartContext()` from LayerChart
  - Draws raw SVG `<line>` with proper pixel coordinates via `ctx.yScale(value)`
  - Styled with Tailwind `stroke-muted-foreground` class (not inline `hsl()` — SVG attribute doesn't resolve CSS custom properties)
  - LayerChart's `<Rule>` component was unusable due to internal filter removing lines outside pixel range

### Phase 10: Patterns Page ✅

- [x] Created `/patterns` route with `+page.server.ts` load function
  - [x] Day-of-week averages (Mon–Sun) via SQL `strftime('%w')` with reordering
  - [x] Month-of-year averages (Jan–Dec) via SQL `strftime('%m')`
  - [x] Heatmap data: daily totals with configurable `?months=N` param (default 3)
- [x] Created `+page.svelte` with 3 sections
  - [x] Day-of-week bar chart (reuses `ConsumptionBarChart`)
  - [x] Month-of-year bar chart (reuses `ConsumptionBarChart`)
  - [x] Calendar heatmap with 3mo/6mo/12mo toggle (`data-sveltekit-noscroll`)
- [x] Created `HeatmapChart.svelte` component
  - [x] GitHub contribution graph style CSS grid (7 rows Mon–Sun × N week columns)
  - [x] Quantile-based 5-level color scale using `color-mix(in oklch, ...)` (compatible with project's oklch theme)
  - [x] Hover tooltip with date + kWh, month labels along top, day labels on left
  - [x] Legend (Less → More), client-side only rendering
  - [x] Uses `SvelteMap`/`SvelteDate` to satisfy `svelte/prefer-svelte-reactivity` lint rule
- [x] Updated NavBar: added "Mönster" link
- [x] Updated home page: added Patterns card with `TrendingUp` icon
- [x] Rounded all bar chart tooltip values to 0 decimals (ConsumptionBarChart)
- [x] Code passes format, lint (no new errors), and type check (no new errors)
- [x] Visual inspection complete

## Next Steps

### Remaining Phases

11. Polish & error handling

## Important Notes

### Data Format Change

- **Original plan:** Hourly data in tab-separated format
- **Actual format:** Daily totals in semicolon-separated format
- **Impact:** Skipped daily view, starting with weekly view as primary analysis page

### Chart Library Decision

- **Original plan:** Chart.js + svelte-chartjs
- **Final decision:** LayerChart (Svelte-native)
- **Reason:** Better integration with shadcn-svelte ecosystem

### Test Data

- Sample data available in `test-data.csv` (9 rows from Jan 29 - Feb 6, 2026)
- Successfully imported into database
- Can run `pnpm test` to verify parser functionality

### Available Commands

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests in watch mode
pnpm test:run     # Run tests once
pnpm check        # Type check
pnpm db:studio    # Open Drizzle Studio
```

### Testing

- Vitest configured and working
- CSV parser has comprehensive test coverage
- Consider adding tests for database operations and form actions

## Resolved Decisions

1. ✅ Skipping daily view, starting with weekly as primary view
2. ✅ Using LayerChart 2.0 (next) instead of Chart.js for Svelte 5 compatibility
3. ✅ Using shadcn-svelte components (button, card, chart installed)

## Key Learnings: Chart Implementation (LayerChart 2.0)

**For reuse in Monthly and Yearly views:**

### Required Dependencies

- `layerchart@2.0.0-next.43` (dev dependency)
- `d3-scale` for `scaleBand()` on categorical x-axis
- shadcn-svelte chart components (optional, we use LayerChart directly)

### Chart Component Pattern

```svelte
import {(Chart, Layer, Axis, Bars, Highlight, Tooltip)} from "layerchart"; import {scaleBand} from "d3-scale";

<Chart
	data={chartData}
	x="label"
	xScale={scaleBand().padding(0.4)}
	y={hasComparison ? ["comparison", "value"] : "value"}
	yDomain={[0, maxValue]}
	yNice
	tooltip={{ mode: "band" }}
>
	<Layer type="svg">
		<!-- Axes, Bars, Highlight -->
	</Layer>
	<Tooltip.Root>
		{#snippet children({ data })}
			<!-- Tooltip content -->
		{/snippet}
	</Tooltip.Root>
</Chart>
```

### Critical Details

1. **Layer type**: Must specify `type="svg"` or colors won't work
2. **x-axis**: Use `scaleBand().padding(0.4)` for categorical data
3. **y-axis**: Separate `y="value"`, `yDomain={[0, max]}`, and `yNice` props
4. **Tooltip**: Use `{#snippet children({ data })}` with destructuring (Svelte 5)
5. **Tooltip mode**: Use `"band"` for stable positioning (not `"bisect-x"`)
6. **Colors**: Use `class="fill-(--color-chart-1)"` for theme integration
7. **Browser check**: Wrap in `{#if browser}` for client-side rendering only
8. **Null handling**: Use `null` for missing data, `0` for zero consumption

### Grouped Bars (Comparison)

- Use `y={["comparison", "value"]}` for two datasets
- Two `<Bars>` components with different colors and insets:
  ```svelte
  <Bars y="comparison" class="fill-muted" />
  <Bars y="value" insets={{ x: 4 }} class="fill-(--color-chart-1)" />
  ```

### Data Preparation

- Server should return `null` for missing data (not `0`)
- Filter nulls when calculating stats and max values
- Create daily/weekly/monthly breakdown arrays for comparison data

## Reminder

⚠️ Remember to commit after completing each phase!
