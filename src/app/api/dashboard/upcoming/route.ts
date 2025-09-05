import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trainingPlans,
  trainingWeeks,
  trainingDays,
  workouts,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const upcomingWorkouts = await db
      .select({
        id: trainingDays.id,
        date: trainingDays.date,
        dayOfWeek: trainingDays.dayOfWeek,
        miles: workouts.miles,
        description: workouts.description,
        isWorkout: workouts.isWorkout,
        planName: trainingPlans.name,
        planId: trainingPlans.id,
        weekNumber: trainingWeeks.weekNumber,
      })
      .from(trainingDays)
      .leftJoin(workouts, eq(trainingDays.workoutId, workouts.id))
      .innerJoin(trainingWeeks, eq(trainingDays.weekId, trainingWeeks.id))
      .innerJoin(trainingPlans, eq(trainingWeeks.planId, trainingPlans.id))
      .where(eq(trainingPlans.userId, session.user.id))
      .orderBy(asc(trainingDays.date))
      .limit(7);

    // Filter for dates >= today (since database comparison might not work as expected)
    const filteredWorkouts = upcomingWorkouts.filter(
      workout => workout.date >= today
    );

    return NextResponse.json({ workouts: filteredWorkouts });
  } catch (error) {
    console.error("Failed to fetch upcoming workouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming workouts" },
      { status: 500 }
    );
  }
}
