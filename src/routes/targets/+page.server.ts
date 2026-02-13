import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { targets } from "$lib/server/db/schema";
import { and, desc, eq, lte } from "drizzle-orm";
import { fail } from "@sveltejs/kit";

const PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly"] as const;
type PeriodType = (typeof PERIOD_TYPES)[number];

function todayString(): string {
	return new Date().toISOString().split("T")[0];
}

export const load: PageServerLoad = async () => {
	const today = todayString();

	// For each period type, get the active target (most recent valid_from <= today)
	const activeTargets: Record<PeriodType, (typeof allTargets)[number] | null> = {
		daily: null,
		weekly: null,
		monthly: null,
		yearly: null
	};

	for (const periodType of PERIOD_TYPES) {
		const result = await db
			.select()
			.from(targets)
			.where(and(eq(targets.periodType, periodType), lte(targets.validFrom, today)))
			.orderBy(desc(targets.validFrom))
			.limit(1);

		activeTargets[periodType] = result[0] ?? null;
	}

	// Get all targets for history table
	const allTargets = await db.select().from(targets).orderBy(desc(targets.validFrom));

	return { activeTargets, allTargets };
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const periodType = formData.get("periodType") as string;
		const kwhTargetStr = formData.get("kwhTarget") as string;
		const validFrom = formData.get("validFrom") as string;

		if (!periodType || !PERIOD_TYPES.includes(periodType as PeriodType)) {
			return fail(400, { error: "Invalid period type." });
		}

		const kwhTarget = parseFloat(kwhTargetStr);
		if (isNaN(kwhTarget) || kwhTarget <= 0) {
			return fail(400, { error: "Target must be a positive number." });
		}

		if (!validFrom || !/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) {
			return fail(400, { error: "Invalid date." });
		}

		try {
			await db.insert(targets).values({
				periodType,
				kwhTarget,
				validFrom
			});
		} catch {
			return fail(500, { error: "Failed to create target. Please try again." });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);

		if (isNaN(id)) {
			return fail(400, { error: "Invalid target ID." });
		}

		try {
			await db.delete(targets).where(eq(targets.id, id));
		} catch {
			return fail(500, { error: "Failed to delete target. Please try again." });
		}

		return { success: true };
	}
} satisfies Actions;
