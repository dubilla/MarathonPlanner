import { eq, desc } from "drizzle-orm";
import { db } from ".";
import {
  nextAuthUsers,
  trainingPlans,
  trainingWeeks,
  workouts,
  type NewTrainingPlan,
  type NewTrainingWeek,
  type NewWorkout,
} from "./schema";

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

// Workout queries
export const getWorkoutsByWeekId = async (weekId: string) => {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.weekId, weekId))
    .orderBy(workouts.dayOfWeek);
};

export const createWorkout = async (data: NewWorkout) => {
  const result = await db.insert(workouts).values(data).returning();
  return result[0];
};

export const updateWorkoutCompletion = async (
  id: string,
  completed: boolean,
  actualDistance?: number,
  actualNotes?: string
) => {
  const result = await db
    .update(workouts)
    .set({
      completed,
      actualDistance: actualDistance?.toString(),
      actualNotes,
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(workouts.id, id))
    .returning();
  return result[0];
};

// Get full training plan with weeks and workouts
export const getFullTrainingPlan = async (id: string) => {
  const plan = await db.query.trainingPlans.findFirst({
    where: eq(trainingPlans.id, id),
    with: {
      weeks: {
        orderBy: trainingWeeks.weekNumber,
        with: {
          workouts: {
            orderBy: workouts.dayOfWeek,
          },
        },
      },
    },
  });
  return plan;
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