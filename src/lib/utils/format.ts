/**
 * Number and value formatting utilities
 */

/**
 * Format a numeric value with unit suffix
 * @param value Number to format
 * @param unit Unit string to append (e.g. "kWh", "L")
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted string with unit suffix
 */
export function formatValue(value: number, unit: string, decimals = 0): string {
	const fixed = value.toFixed(decimals);
	const [intPart, decPart] = fixed.split(".");
	const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
	return `${decPart ? `${formatted}.${decPart}` : formatted} ${unit}`;
}

/**
 * Format kWh value with appropriate precision
 * @param kwh Number to format
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted string with "kWh" suffix
 */
export function formatKWh(kwh: number, decimals = 0): string {
	return formatValue(kwh, "kWh", decimals);
}

/**
 * Format percentage with + or - sign
 * @param percent Percentage value
 * @returns Formatted string like "+12.5%" or "-8.3%"
 */
export function formatPercent(percent: number): string {
	const sign = percent > 0 ? "+" : "";
	return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Format number with locale-specific separators
 * @param num Number to format
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatNumber(num: number, decimals = 0): string {
	const fixed = num.toFixed(decimals);
	const [intPart, decPart] = fixed.split(".");
	const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
	return decPart ? `${formatted}.${decPart}` : formatted;
}
