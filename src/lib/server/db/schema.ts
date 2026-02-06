import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const consumption = sqliteTable("consumption", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	timestamp: text("timestamp").notNull().unique(),
	kwh: real("kwh").notNull()
});

export const targets = sqliteTable("targets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	periodType: text("period_type").notNull(),
	kwhTarget: real("kwh_target").notNull(),
	validFrom: text("valid_from").notNull()
});
