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
export const getFullTrainingPlan = async (id: string): Promise<PlanWithRelations | null> => {
  try {
    // First get the plan
    const plan = await db
      .select()
      .from(trainingPlans)
      .where(eq(trainingPlans.id, id))
      .limit(1);
    
    if (!plan || plan.length === 0) {
      return null;
    }

    // Then get all weeks for this plan
    const weeks = await db
      .select()
      .from(trainingWeeks)
      .where(eq(trainingWeeks.planId, id))
      .orderBy(trainingWeeks.weekNumber);

    // Get all training days for all weeks
    const weekIds = weeks.map(w => w.id);
    let trainingDaysForAllWeeks: typeof trainingDays.$inferSelect[] = [];
    
    if (weekIds.length > 0) {
      // Fetch training days for all weeks at once
      const allDays = await Promise.all(
        weekIds.map(weekId =>
          db
            .select()
            .from(trainingDays)
            .where(eq(trainingDays.weekId, weekId))
            .orderBy(trainingDays.dayOfWeek)
        )
      );
      trainingDaysForAllWeeks = allDays.flat();
    }

    // Assemble the full plan structure
    const fullPlan: PlanWithRelations = {
      ...plan[0],
      weeks: weeks.map(week => ({
        ...week,
        trainingDays: trainingDaysForAllWeeks.filter(day => day.weekId === week.id)
      }))
    };

    return fullPlan;
  } catch (error) {
    console.error('Failed to fetch training plan:', error);
    throw error;
  }
};

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

    // Prepare all weeks data for batch insert
    const weeksData = plan.weeks.map(week => ({
      id: week.id,
      planId: plan.id,
      weekNumber: week.weekNumber,
      startDate: week.startDate,
      targetMileage: week.targetMileage,
      actualMileage: week.actualMileage,
      notes: week.notes,
    }));

    // Batch insert all weeks
    if (weeksData.length > 0) {
      await tx.insert(trainingWeeks).values(weeksData);
    }

    // Prepare all training days data for batch insert
    const daysData = plan.weeks.flatMap(week =>
      week.trainingDays.map(day => ({
        id: day.id,
        weekId: week.id,
        dayOfWeek: Number(day.dayOfWeek),
        date: day.date,
        miles: day.miles,
        description: day.description,
      }))
    );

    // Batch insert all training days
    if (daysData.length > 0) {
      await tx.insert(trainingDays).values(daysData);
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
