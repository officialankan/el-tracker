# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electricity Consumption Tracker — a local-only SvelteKit app for importing, analyzing, and visualizing daily household electricity data from Swedish provider CSV exports. No authentication. See `initial-plan.md` for the full specification and `PROGRESS.md` for current implementation status.

## Tech Stack

- **SvelteKit 2 / Svelte 5** with TypeScript (strict mode)
- **SQLite** via Drizzle ORM + better-sqlite3
- **Tailwind CSS 4** (Vite plugin, not PostCSS)
- **shadcn-svelte** for UI components (installed via `npx shadcn-svelte@latest add <component>`)
- **Chart.js + svelte-chartjs** for data visualization (planned, not yet in dependencies)
- **pnpm** as package manager

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm check            # Svelte type checking (svelte-kit sync + svelte-check)
pnpm lint             # Prettier check + ESLint
pnpm format           # Auto-format with Prettier
pnpm db:push          # Push schema changes directly to SQLite
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run Drizzle migrations
pnpm db:studio        # Open Drizzle Studio UI
```

No test framework is configured yet.

## Architecture

### Data Flow

All data fetching uses SvelteKit server load functions (`+page.server.ts`). No separate API routes. Mutations use SvelteKit form actions. Application state is URL-driven via search params (e.g., `/daily?date=2026-02-04&compare=2026-02-03`).

### Database

- Schema defined in `src/lib/server/db/schema.ts`
- Connection setup in `src/lib/server/db/index.ts`
- Config in `drizzle.config.ts` — reads `DATABASE_URL` from `.env` (default: `local.db`)
- Planned tables: `consumption` (hourly kWh data with unique timestamp) and `targets` (per-period kWh targets with `valid_from` versioning)

### Routing

Eight planned routes following SvelteKit file-based routing under `src/routes/`:
- `/` — Home/dashboard
- `/import` — CSV file upload (form action)
- `/daily`, `/weekly`, `/monthly`, `/yearly` — Analysis views with bar charts, stats cards, comparison overlays, and target indicators
- `/patterns` — Heatmap + aggregated pattern analysis
- `/targets` — Target CRUD with form actions

### Component Patterns

All four analysis views (daily/weekly/monthly/yearly) share the same structural pattern: period selector, navigation arrows, bar chart, comparison overlay, and stats card. Reusable components live in `src/lib/components/`. shadcn-svelte UI components go in `src/lib/components/ui/`.

### Key Aliases

- `$lib` → `src/lib/`
- `$lib/components/ui` → shadcn-svelte components
- `$lib/server/db` → database layer (server-only)

## Code Style

- **Tabs** for indentation
- **Double quotes**, no trailing commas
- Print width: 100
- Prettier plugins: `prettier-plugin-svelte` + `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes)
- ESLint: flat config (ESLint 9+) with TypeScript project service and Svelte plugin

## CSV Import Format

The source data is tab-separated with Swedish formatting:
```
Datum	El kWh
2026-02-04 00:00 (ons)	4,472
```
- Parse first 16 chars of timestamp, ignore day abbreviation in parens
- Replace comma with dot for decimal values
- Store as ISO 8601 (`2026-02-04T00:00:00`), local Swedish time
- Use `onConflictDoNothing()` for duplicate handling

## Svelte MCP Server

When developing Svelte code, use the Svelte MCP tools:
1. `list-sections` — discover documentation sections (use FIRST)
2. `get-documentation` — fetch relevant docs based on use_cases
3. `svelte-autofixer` — validate Svelte code before delivering (MUST use, repeat until clean)
4. `playground-link` — generate playground links (only after user confirmation, never if code was written to files)
