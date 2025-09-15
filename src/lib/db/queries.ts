import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from ".";
import {
  nextAuthUsers,
  trainingPlans,
  trainingWeeks,
  trainingDays,
  workouts,
  type NewTrainingPlan,
  type NewTrainingWeek,
  type NewTrainingDay,
} from "./schema";
import { PlanWithRelations } from "@/services/PlanCreationService";

// User queries
export const getUserByEmail = async (email: string) => {
  const users = await db.query.nextAuthUsers.findMany({
    where: eq(nextAuthUsers.email, email),
  });
  return users[0];
};

export const createUser = async (userData: {
  email: string;
  name?: string;
}) => {
  const newUser = await db
    .insert(nextAuthUsers)
    .values({
      id: crypto.randomUUID(),
      email: userData.email,
      name: userData.name || null,
    })
    .returning();

  return newUser[0];
};

// Training plan queries
export const getTrainingPlansByUserId = async (userId: string) => {
  return await db.query.trainingPlans.findMany({
    where: eq(trainingPlans.userId, userId),
    orderBy: [desc(trainingPlans.createdAt)],
  });
};

export const getTrainingPlanById = async (planId: string) => {
  return await db.query.trainingPlans.findFirst({
    where: eq(trainingPlans.id, planId),
  });
};

// Get full training plan with all related data
export const getFullTrainingPlan = async (
  planId: string
): Promise<PlanWithRelations | null> => {
  const plan = await db.query.trainingPlans.findFirst({
    where: eq(trainingPlans.id, planId),
    with: {
      weeks: {
        with: {
          trainingDays: {
            with: {
              workout: true,
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return null;
  }

  return plan as PlanWithRelations;
};

export const createTrainingPlan = async (planData: NewTrainingPlan) => {
  const newPlan = await db.insert(trainingPlans).values(planData).returning();
  return newPlan[0];
};

export const deleteTrainingPlan = async (planId: string) => {
  const deletedPlan = await db
    .delete(trainingPlans)
    .where(eq(trainingPlans.id, planId))
    .returning();
  return deletedPlan[0];
};

export const createTrainingWeek = async (weekData: NewTrainingWeek) => {
  const newWeek = await db.insert(trainingWeeks).values(weekData).returning();
  return newWeek[0];
};

export const createTrainingDay = async (dayData: NewTrainingDay) => {
  const newDay = await db.insert(trainingDays).values(dayData).returning();
  return newDay[0];
};

export const updateTrainingPlan = async (
  planId: string,
  updates: Partial<NewTrainingPlan>
) => {
  const updatedPlan = await db
    .update(trainingPlans)
    .set(updates)
    .where(eq(trainingPlans.id, planId))
    .returning();
  return updatedPlan[0];
};

// Get stats for dashboard
export const getTrainingStats = async (userId: string) => {
  const plans = await db.query.trainingPlans.findMany({
    where: eq(trainingPlans.userId, userId),
  });

  return {
    totalPlans: plans.length,
    activePlans: plans.length, // For now, all plans are considered active
    completedWorkouts: 0, // This would need to be calculated based on completed training days
    totalMiles: 0, // This would need to be calculated based on actual miles logged
  };
};

// Get recent activity for dashboard
export const getRecentActivity = async (userId: string) => {
  // This would return recent training day completions, plan creations, etc.
  // For now, return empty array
  return [];
};

// Get upcoming workouts for dashboard
export const getUpcomingWorkouts = async (userId: string) => {
  // This would return upcoming training days based on current date
  // For now, return empty array
  return [];
};

// Batch save entire training plan with all weeks and days
export const savePlan = async (plan: PlanWithRelations) => {
  return await db.transaction(async tx => {
    // Save the main plan
    const savedPlan = await tx
      .insert(trainingPlans)
      .values({
        id: plan.id,
        userId: plan.userId,
        name: plan.name,
        description: plan.description,
        marathonDate: new Date(plan.marathonDate),
        goalTime: plan.goalTime,
        totalWeeks: plan.totalWeeks,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Prepare weeks data
    const weeksData = plan.weeks.map(week => ({
      id: week.id,
      planId: plan.id,
      weekNumber: week.weekNumber,
      startDate: new Date(week.startDate),
      targetMileage: week.targetMileage.toString(),
      actualMileage: week.actualMileage?.toString() || null,
      notes: week.notes,
    }));

    // Batch insert all weeks
    if (weeksData.length > 0) {
      await tx.insert(trainingWeeks).values(weeksData);
    }

    // Prepare workout data for days with miles > 0
    const workoutsData: any[] = [];
    const daysData: any[] = [];

    plan.weeks.forEach(week => {
      week.trainingDays.forEach((day: any) => {
        // Create workout record for non-rest days
        if (day.miles && Number(day.miles) > 0) {
          const workoutId = randomUUID();
          workoutsData.push({
            id: workoutId,
            miles: day.miles,
            description: day.description,
            isWorkout:
              day.description?.toLowerCase().includes("workout") ||
              day.description?.toLowerCase().includes("tempo") ||
              day.description?.toLowerCase().includes("long run"),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Create training day linked to workout
          daysData.push({
            id: day.id,
            weekId: week.id,
            dayOfWeek: Number(day.dayOfWeek),
            date: day.date,
            workoutId,
            actualMiles: null,
            actualNotes: null,
            completed: false,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Create rest day without workout
          daysData.push({
            id: day.id,
            weekId: week.id,
            dayOfWeek: Number(day.dayOfWeek),
            date: day.date,
            workoutId: null,
            actualMiles: null,
            actualNotes: null,
            completed: false,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    });

    // Batch insert workouts first
    if (workoutsData.length > 0) {
      await tx.insert(workouts).values(workoutsData);
    }

    // Then batch insert training days
    if (daysData.length > 0) {
      await tx.insert(trainingDays).values(daysData);
    }

    return savedPlan[0];
  });
};