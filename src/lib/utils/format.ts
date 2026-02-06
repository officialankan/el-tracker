/**
 * Number and value formatting utilities
 */

/**
 * Format kWh value with appropriate precision
 * @param kwh Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string with "kWh" suffix
 */
export function formatKWh(kwh: number, decimals = 2): string {
	return `${kwh.toFixed(decimals)} kWh`;
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
	return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
