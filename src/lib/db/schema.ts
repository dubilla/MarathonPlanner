import { relations, sql } from "drizzle-orm";
import {
  date,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";

// NextAuth.js required tables
export const nextAuthUsers = pgTable("User", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
});

export const nextAuthAccounts = pgTable(
  "Account",
  {
    userId: text("userId")
      .notNull()
      .references(() => nextAuthUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const nextAuthSessions = pgTable("Session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => nextAuthUsers.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const nextAuthVerificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Legacy users table removed - now using NextAuth User table

// Training plans table
export const trainingPlans = pgTable(
  "training_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => nextAuthUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    marathonDate: date("marathon_date").notNull(),
    goalTime: text("goal_time"),
    totalWeeks: integer("total_weeks").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    totalWeeksCheck: check(
      "total_weeks_check",
      sql`${table.totalWeeks} > 0 AND ${table.totalWeeks} <= 52`
    ),
  })
);

// Training weeks table
export const trainingWeeks = pgTable(
  "training_weeks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => trainingPlans.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    startDate: date("start_date").notNull(),
    targetMileage: decimal("target_mileage", { precision: 5, scale: 2 })
      .notNull(),
    actualMileage: decimal("actual_mileage", { precision: 5, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    weekNumberCheck: check("week_number_check", sql`${table.weekNumber} > 0`),
    targetMileageCheck: check(
      "target_mileage_check",
      sql`${table.targetMileage} >= 0`
    ),
    actualMileageCheck: check(
      "actual_mileage_check",
      sql`${table.actualMileage} >= 0`
    ),
  })
);

// Training days table
export const trainingDays = pgTable(
  "training_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => trainingWeeks.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    date: date("date").notNull(),
    miles: decimal("miles", { precision: 5, scale: 2 }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    dayOfWeekCheck: check(
      "day_of_week_check",
      sql`${table.dayOfWeek} >= 1 AND ${table.dayOfWeek} <= 7`
    ),
    milesCheck: check(
      "miles_check",
      sql`${table.miles} >= 0`
    ),
  })
);

// Relations
// NextAuth relations
export const nextAuthUsersRelations = relations(nextAuthUsers, ({ many }) => ({
  accounts: many(nextAuthAccounts),
  sessions: many(nextAuthSessions),
  trainingPlans: many(trainingPlans),
}));

export const nextAuthAccountsRelations = relations(nextAuthAccounts, ({ one }) => ({
  user: one(nextAuthUsers, {
    fields: [nextAuthAccounts.userId],
    references: [nextAuthUsers.id],
  }),
}));

export const nextAuthSessionsRelations = relations(nextAuthSessions, ({ one }) => ({
  user: one(nextAuthUsers, {
    fields: [nextAuthSessions.userId],
    references: [nextAuthUsers.id],
  }),
}));

// Legacy relations removed

// App relations
export const trainingPlansRelations = relations(
  trainingPlans,
  ({ one, many }) => ({
    user: one(nextAuthUsers, {
      fields: [trainingPlans.userId],
      references: [nextAuthUsers.id],
    }),
    weeks: many(trainingWeeks),
  })
);

export const trainingWeeksRelations = relations(
  trainingWeeks,
  ({ one, many }) => ({
    plan: one(trainingPlans, {
      fields: [trainingWeeks.planId],
      references: [trainingPlans.id],
    }),
    trainingDays: many(trainingDays),
  })
);

export const trainingDaysRelations = relations(trainingDays, ({ one }) => ({
  week: one(trainingWeeks, {
    fields: [trainingDays.weekId],
    references: [trainingWeeks.id],
  }),
}));

// Types derived from schema
// NextAuth types
export type NextAuthUser = typeof nextAuthUsers.$inferSelect;
export type NewNextAuthUser = typeof nextAuthUsers.$inferInsert;
export type NextAuthAccount = typeof nextAuthAccounts.$inferSelect;
export type NextAuthSession = typeof nextAuthSessions.$inferSelect;
export type NextAuthVerificationToken = typeof nextAuthVerificationTokens.$inferSelect;

// Legacy types removed - use NextAuthUser instead

export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type NewTrainingPlan = typeof trainingPlans.$inferInsert;

export type TrainingWeek = typeof trainingWeeks.$inferSelect;
export type NewTrainingWeek = typeof trainingWeeks.$inferInsert;

export type TrainingDay = typeof trainingDays.$inferSelect;
export type NewTrainingDay = typeof trainingDays.$inferInsert;