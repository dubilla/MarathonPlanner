import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
} from "drizzle-orm/pg-core";

// Users table (for app-specific user data)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Training plans table
export const trainingPlans = pgTable(
  "training_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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

// Workouts table
export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => trainingWeeks.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    workoutType: text("workout_type", {
      enum: ["easy", "long", "tempo", "intervals", "rest", "cross_training"],
    }).notNull(),
    plannedDistance: decimal("planned_distance", {
      precision: 5,
      scale: 2,
    }).notNull(),
    plannedDescription: text("planned_description").notNull(),
    actualDistance: decimal("actual_distance", { precision: 5, scale: 2 }),
    actualNotes: text("actual_notes"),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    dayOfWeekCheck: check(
      "day_of_week_check",
      sql`${table.dayOfWeek} >= 1 AND ${table.dayOfWeek} <= 7`
    ),
    plannedDistanceCheck: check(
      "planned_distance_check",
      sql`${table.plannedDistance} >= 0`
    ),
    actualDistanceCheck: check(
      "actual_distance_check",
      sql`${table.actualDistance} >= 0`
    ),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trainingPlans: many(trainingPlans),
}));

export const trainingPlansRelations = relations(
  trainingPlans,
  ({ one, many }) => ({
    user: one(users, {
      fields: [trainingPlans.userId],
      references: [users.id],
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
    workouts: many(workouts),
  })
);

export const workoutsRelations = relations(workouts, ({ one }) => ({
  week: one(trainingWeeks, {
    fields: [workouts.weekId],
    references: [trainingWeeks.id],
  }),
}));

// Types derived from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type NewTrainingPlan = typeof trainingPlans.$inferInsert;

export type TrainingWeek = typeof trainingWeeks.$inferSelect;
export type NewTrainingWeek = typeof trainingWeeks.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutType = "easy" | "long" | "tempo" | "intervals" | "rest" | "cross_training";