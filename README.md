# el-tracker

A local-only electricity consumption tracker for Swedish household data. No authentication, no cloud — runs entirely on your machine.

Designed for data from Swedish electricity providers — import via CSV file upload or by pasting directly from the clipboard.

> [!NOTE]
> This project was developed with AI assistance and is tailored specifically to data from a single Swedish electricity provider. It may not work out of the box with data from other providers.

## Setup

**Prerequisites:** Node.js, pnpm

```sh
pnpm install
pnpm db:push        # Initialize the SQLite database
pnpm dev            # Start the dev server at http://localhost:5173
```

## Importing data

Go to `/import` and either upload your provider's CSV export or paste the data directly. Expected format:

```
Datum	El kWh
2026-02-04 00:00 (ons)	4,472
```

Duplicate rows are silently ignored — safe to re-import the same file.

## Commands

```sh
pnpm dev            # Dev server
pnpm build          # Production build
pnpm preview        # Preview production build
pnpm db:studio      # Open Drizzle Studio to inspect the database
pnpm check          # Type checking
pnpm lint           # Lint + format check
pnpm format         # Auto-format
pnpm test           # Run unit tests (watch mode)
pnpm test:run       # Run unit tests once
```

## Tests

Unit tests live in `tests/` and are run with [Vitest](https://vitest.dev/). They cover the core utility modules:

- **csv-parser** — CSV parsing, Swedish decimal handling, error cases
- **date-utils** — ISO week calculations, navigation, date range formatting
- **format** — kWh, percentage, and number formatting
- **gaps** — detecting missing days in a consumption dataset
