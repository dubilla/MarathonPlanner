import { eq, desc } from "drizzle-orm";
import { db } from ".";
import {
  nextAuthUsers,
  trainingPlans,
  trainingWeeks,
  trainingDays,
  type NewTrainingPlan,
  type NewTrainingWeek,
  type NewTrainingDay,
} from "./schema";
import { PlanWithRelations } from "@/services/PlanCreationService";

// User queries
export const getUserByEmail = async (email: string) => {
  const result = await db.select().from(nextAuthUsers).where(eq(nextAuthUsers.email, email));
  return result[0] || null;
};

export const getUserById = async (id: string) => {
  const result = await db.select().from(nextAuthUsers).where(eq(nextAuthUsers.id, id));
  return result[0] || null;
};

// Training plan queries
export const getTrainingPlansByUserId = async (userId: string) => {
  return await db
    .select()
    .from(trainingPlans)
    .where(eq(trainingPlans.userId, userId))
    .orderBy(desc(trainingPlans.createdAt));
};

export const getTrainingPlanById = async (id: string) => {
  const result = await db
    .select()
    .from(trainingPlans)
    .where(eq(trainingPlans.id, id));
  return result[0] || null;
};

export const createTrainingPlan = async (data: NewTrainingPlan) => {
  const result = await db.insert(trainingPlans).values(data).returning();
  return result[0];
};

// Training week queries
export const getTrainingWeeksByPlanId = async (planId: string) => {
  return await db
    .select()
    .from(trainingWeeks)
    .where(eq(trainingWeeks.planId, planId))
    .orderBy(trainingWeeks.weekNumber);
};

export const createTrainingWeek = async (data: NewTrainingWeek) => {
  const result = await db.insert(trainingWeeks).values(data).returning();
  return result[0];
};

// Training day queries
export const getTrainingDaysByWeekId = async (weekId: string) => {
  return await db
    .select()
    .from(trainingDays)
    .where(eq(trainingDays.weekId, weekId))
    .orderBy(trainingDays.dayOfWeek);
};

export const createTrainingDay = async (data: NewTrainingDay) => {
  const result = await db.insert(trainingDays).values(data).returning();
  return result[0];
};

// Get full training plan with weeks and training days
export const getFullTrainingPlan = async (id: string) => {
  const plan = await db.query.trainingPlans.findFirst({
    where: eq(trainingPlans.id, id),
    with: {
      weeks: {
        orderBy: trainingWeeks.weekNumber,
        with: {
          trainingDays: {
            orderBy: trainingDays.dayOfWeek,
          },
        },
      },
    },
  });
  return plan;
};

// Save a complete training plan with all weeks and days
export const savePlan = async (plan: PlanWithRelations) => {
  return await db.transaction(async (tx) => {
    // Save the main plan
    const savedPlan = await tx.insert(trainingPlans).values({
      id: plan.id,
      userId: plan.userId,
      name: plan.name,
      description: plan.description,
      marathonDate: plan.marathonDate,
      goalTime: plan.goalTime,
      totalWeeks: plan.totalWeeks,
    }).returning();

    // Save all weeks
    for (const week of plan.weeks) {
      await tx.insert(trainingWeeks).values({
        id: week.id,
        planId: savedPlan[0].id,
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        targetMileage: week.targetMileage,
        actualMileage: week.actualMileage,
        notes: week.notes,
      });

      // Save all training days for this week
      for (const day of week.trainingDays) {
        await tx.insert(trainingDays).values({
          id: day.id,
          weekId: week.id,
          dayOfWeek: day.dayOfWeek,
          miles: day.miles,
          description: day.description,
        });
      }
    }

    return savedPlan[0];
  });
};

// Get all public training plans (for community features)
export const getPublicTrainingPlans = async (limit = 20) => {
  return await db
    .select({
      id: trainingPlans.id,
      name: trainingPlans.name,
      description: trainingPlans.description,
      marathonDate: trainingPlans.marathonDate,
      goalTime: trainingPlans.goalTime,
      totalWeeks: trainingPlans.totalWeeks,
      createdAt: trainingPlans.createdAt,
      user: {
        id: nextAuthUsers.id,
        name: nextAuthUsers.name,
      },
    })
    .from(trainingPlans)
    .leftJoin(nextAuthUsers, eq(trainingPlans.userId, nextAuthUsers.id))
    .orderBy(desc(trainingPlans.createdAt))
    .limit(limit);
};