# Architecture & Build Notes

Initial implementation (phases 1–10) is complete. See `TODO.md` for ongoing feature work.

## Build Summary

All 10 phases shipped:

1. **Database Layer** — SQLite via Drizzle ORM (`consumption` + `targets` tables)
2. **CSV Parser** — semicolon-separated, Swedish decimal format, BOM handling
3. **Import Page** — file upload + paste, duplicate overwrite, result display
4. **Weekly View** — bar chart, stats card, rolling average, comparison overlay
5. **Monthly View** — same pattern, projection for incomplete months
6. **Yearly View** — same pattern, monthly totals, projection for incomplete years
7. **Comparison Overlays** — custom period comparison via URL params on all views
8. **Targets Page** — CRUD for per-period kWh targets with `valid_from` versioning
9. **Target Integration** — cumulative area overlay + dashed target line on charts
10. **Patterns Page** — day-of-week/month-of-year averages, calendar heatmap, period filtering + comparison

## Key Decisions

- **No daily view** — source data is daily totals (not hourly), so weekly is the primary analysis page
- **LayerChart** over Chart.js — better Svelte 5 / shadcn-svelte integration
- **date-fns** for ISO week calculations
- **URL-driven state** — all period selection and comparison via search params

## Important Notes

### Data Format

- **Actual format:** Daily totals in semicolon-separated CSV with Swedish formatting
- Parse first 16 chars of timestamp, replace comma → dot for decimals
- Store as ISO 8601, local Swedish time
- Duplicate handling: `onConflictDoUpdate()` (overwrites partial-day data on re-import)

### Chart Implementation (LayerChart 2.0)

#### Required Dependencies

- `layerchart@2.0.0-next.43` (dev dependency)
- `d3-scale` for `scaleBand()` on categorical x-axis

#### Critical Details

1. **Layer type**: Must specify `type="svg"` or colors won't work
2. **x-axis**: Use `scaleBand().padding(0.4)` for categorical data
3. **y-axis**: Separate `y="value"`, `yDomain={[0, max]}`, and `yNice` props
4. **Tooltip**: Use `{#snippet children({ data })}` with destructuring (Svelte 5)
5. **Tooltip mode**: Use `"band"` for stable positioning (not `"bisect-x"`)
6. **Colors**: Use `class="fill-(--color-chart-1)"` for theme integration
7. **Browser check**: Wrap in `{#if browser}` for client-side rendering only
8. **Null handling**: Use `null` for missing data, `0` for zero consumption

#### Grouped Bars (Comparison)

- Use `y={["comparison", "value"]}` for two datasets
- Two `<Bars>` components with different colors and insets

#### Target Line

- Custom `TargetLine.svelte` using `getChartContext()` — LayerChart's `<Rule>` was unusable
- Draws raw SVG `<line>` with `ctx.yScale(value)` for pixel coordinates
- Use Tailwind classes (not inline `hsl()`) for SVG stroke colors

#### Data Preparation

- Server returns `null` for missing data (not `0`)
- Filter nulls when calculating stats and max values
- Create daily/weekly/monthly breakdown arrays for comparison data
