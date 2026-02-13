import { integer, sqliteTable, text, real, unique } from "drizzle-orm/sqlite-core";

export const consumption = sqliteTable(
	"consumption",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		timestamp: text("timestamp").notNull(),
		kwh: real("kwh").notNull(),
		resourceType: text("resource_type").notNull().default("el")
	},
	(table) => [unique().on(table.timestamp, table.resourceType)]
);

export const targets = sqliteTable("targets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	periodType: text("period_type").notNull(),
	kwhTarget: real("kwh_target").notNull(),
	validFrom: text("valid_from").notNull(),
	resourceType: text("resource_type").notNull().default("el")
});
