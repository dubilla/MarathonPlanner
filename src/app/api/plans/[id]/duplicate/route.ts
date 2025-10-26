import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFullTrainingPlan, savePlan } from "@/lib/db/queries";
import { PlanWithRelations } from "@/services/PlanCreator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: planId } = await params;

  if (!planId) {
    return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate input
  const { name, description, marathonDate, goalTime } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Plan name is required" },
      { status: 400 }
    );
  }

  if (!marathonDate || !Date.parse(marathonDate)) {
    return NextResponse.json(
      { error: "Valid marathon date is required" },
      { status: 400 }
    );
  }

  // Get the source plan
  let sourcePlan;
  try {
    sourcePlan = await getFullTrainingPlan(planId);
  } catch (error) {
    console.error("Database error fetching source training plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch source training plan" },
      { status: 500 }
    );
  }

  if (!sourcePlan) {
    return NextResponse.json(
      { error: "Source training plan not found" },
      { status: 404 }
    );
  }

  // Allow duplication even if the plan doesn't belong to the user (for sharing templates)
  // But ensure the duplicated plan belongs to the current user
  try {
    // Generate new IDs first
    const newPlanId = crypto.randomUUID();
    const originalMarathonDate = new Date(sourcePlan.marathonDate);
    const newMarathonDate = new Date(marathonDate);
    const dateDiff = newMarathonDate.getTime() - originalMarathonDate.getTime();

    // Create a new plan based on the source plan
    const duplicatedPlan: PlanWithRelations = {
      ...sourcePlan,
      id: newPlanId,
      userId: session.user.id, // Set to current user
      name: name.trim(),
      description: description?.trim() || null,
      marathonDate: marathonDate,
      goalTime: goalTime?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      weeks: sourcePlan.weeks.map(week => {
        // Calculate new dates based on the new marathon date
        const newWeekStartDate = new Date(week.startDate);
        newWeekStartDate.setTime(newWeekStartDate.getTime() + dateDiff);
        const newWeekId = crypto.randomUUID();

        return {
          ...week,
          id: newWeekId,
          planId: newPlanId,
          startDate: newWeekStartDate.toISOString().split("T")[0],
          actualMileage: null, // Reset progress
          notes: null, // Reset notes
          createdAt: new Date(),
          updatedAt: new Date(),
          trainingDays: week.trainingDays.map(day => {
            const newDayDate = new Date(day.date);
            newDayDate.setTime(newDayDate.getTime() + dateDiff);

            // Include legacy miles/description for savePlan to use
            // savePlan will create new workout records
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newDay: any = {
              id: crypto.randomUUID(),
              weekId: newWeekId,
              dayOfWeek: day.dayOfWeek,
              date: newDayDate.toISOString().split("T")[0],
              workoutId: null, // Will be created by savePlan
              actualMiles: null,
              actualNotes: null,
              completed: false,
              completedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Add miles/description from workout if it exists (for savePlan to create new workout)
            if (day.workout) {
              newDay.miles = day.workout.miles;
              newDay.description = day.workout.description;
            }

            return newDay;
          }),
        };
      }),
    };

    // Save the duplicated plan
    await savePlan(duplicatedPlan);

    // Return the full plan with all relations
    const fullDuplicatedPlan = await getFullTrainingPlan(duplicatedPlan.id);

    return NextResponse.json({
      success: true,
      plan: fullDuplicatedPlan,
      message: "Plan duplicated successfully",
    });
  } catch (error) {
    console.error("Database error duplicating training plan:", error);
    return NextResponse.json(
      { error: "Failed to duplicate training plan" },
      { status: 500 }
    );
  }
}
