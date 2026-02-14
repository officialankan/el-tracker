export type ResourceType = "el" | "water";

export interface ResourceConfig {
	label: string;
	unit: string;
	icon: "Zap" | "Droplet";
	navLinks: { title: string; href: string }[][];
}

const allNavLinks: { title: string; href: string }[][] = [
	[{ title: "Importera", href: "/import" }],
	[
		{ title: "Vecka", href: "/weekly" },
		{ title: "Månad", href: "/monthly" },
		{ title: "År", href: "/yearly" }
	],
	[
		{ title: "Mönster", href: "/patterns" },
		{ title: "Mål", href: "/targets" },
		{ title: "Kostnad", href: "/cost" }
	]
];

export const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
	el: {
		label: "El Tracker",
		unit: "kWh",
		icon: "Zap",
		navLinks: allNavLinks
	},
	water: {
		label: "H2O Tracker",
		unit: "L",
		icon: "Droplet",
		navLinks: allNavLinks.map((group) => group.filter((l) => l.href !== "/weekly"))
	}
};
