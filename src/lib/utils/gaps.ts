export interface DateGap {
	start: string; // YYYY-MM-DD
	end: string; // YYYY-MM-DD (equals start for 1-day gaps)
	days: number;
}

export function findDateGaps(sortedDates: string[]): DateGap[] {
	if (sortedDates.length < 2) return [];

	const gaps: DateGap[] = [];

	for (let i = 1; i < sortedDates.length; i++) {
		const prev = sortedDates[i - 1];
		const curr = sortedDates[i];

		// Use noon UTC to avoid DST issues
		const prevMs = Date.UTC(+prev.slice(0, 4), +prev.slice(5, 7) - 1, +prev.slice(8, 10), 12);
		const currMs = Date.UTC(+curr.slice(0, 4), +curr.slice(5, 7) - 1, +curr.slice(8, 10), 12);

		const diffDays = Math.round((currMs - prevMs) / 86_400_000);

		if (diffDays > 1) {
			const startMs = prevMs + 86_400_000;
			const endMs = currMs - 86_400_000;

			gaps.push({
				start: msToDate(startMs),
				end: msToDate(endMs),
				days: diffDays - 1
			});
		}
	}

	return gaps;
}

function msToDate(ms: number): string {
	const d = new Date(ms);
	const year = d.getUTCFullYear();
	const month = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
