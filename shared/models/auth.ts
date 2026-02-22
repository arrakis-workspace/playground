import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  handle: varchar("handle").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  contactNumber: varchar("contact_number"),
  country: varchar("country"),
  profileImageUrl: varchar("profile_image_url"),
  snaptradeUserSecret: varchar("snaptrade_user_secret"),
  profileCompleted: timestamp("profile_completed"),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  textNotifications: boolean("text_notifications").default(false).notNull(),
  lastSeenRequestsAt: timestamp("last_seen_requests_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  country: z.string().min(1, "Country is required"),
});

export const updateHandleSchema = z.object({
  handle: z.string().min(3, "Handle must be at least 3 characters").max(30, "Handle must be at most 30 characters").regex(/^[a-z0-9_]+$/, "Handle can only contain lowercase letters, numbers, and underscores"),
});

export const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  textNotifications: z.boolean(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationSettings = z.infer<typeof updateNotificationSettingsSchema>;
