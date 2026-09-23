import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  audience: text("audience").notNull(),
  status: text("status").notNull().default("draft"),
  sentCount: integer("sent_count").notNull().default(0),
  openRate: real("open_rate").notNull().default(0),
  replyRate: real("reply_rate").notNull().default(0),
  nextSendAt: timestamp("next_send_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sequenceStepsTable = pgTable("sequence_steps", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaignsTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  delayDays: integer("delay_days").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  openRate: real("open_rate").notNull().default(0),
  replyRate: real("reply_rate").notNull().default(0),
});

export const prospectsTable = pgTable("prospects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  campaignId: integer("campaign_id").references(() => campaignsTable.id, {
    onDelete: "set null",
  }),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  prospectName: text("prospect_name").notNull(),
  campaignName: text("campaign_name").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({
  id: true,
  createdAt: true,
});
export const insertSequenceStepSchema = createInsertSchema(
  sequenceStepsTable,
).omit({ id: true });
export const insertProspectSchema = createInsertSchema(prospectsTable).omit({
  id: true,
  createdAt: true,
});
export const insertActivitySchema = createInsertSchema(activitiesTable).omit({
  id: true,
  occurredAt: true,
});

export type Campaign = typeof campaignsTable.$inferSelect;
export type SequenceStep = typeof sequenceStepsTable.$inferSelect;
export type Prospect = typeof prospectsTable.$inferSelect;
export type Activity = typeof activitiesTable.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertSequenceStep = z.infer<typeof insertSequenceStepSchema>;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;