import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { trainingDays, workouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateTrainingDaySchema = z.object({
  miles: z.number().min(0).optional(),
  description: z.string().optional(),
  isWorkout: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Training day ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTrainingDaySchema.parse(body);

    // First, get the current training day to verify ownership
    const trainingDay = await db.query.trainingDays.findFirst({
      where: eq(trainingDays.id, id),
      with: {
        week: {
          with: {
            plan: true,
          },
        },
        workout: true,
      },
    });

    if (!trainingDay) {
      return NextResponse.json(
        { error: "Training day not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (trainingDay.week.plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this training day" },
        { status: 403 }
      );
    }

    // If we're updating workout details, we need to handle the workout record
    if (
      validatedData.miles !== undefined ||
      validatedData.description !== undefined ||
      validatedData.isWorkout !== undefined
    ) {
      if (trainingDay.workoutId) {
        // Update existing workout
        await db
          .update(workouts)
          .set({
            ...(validatedData.miles !== undefined && {
              miles: validatedData.miles.toString(),
            }),
            ...(validatedData.description !== undefined && {
              description: validatedData.description,
            }),
            ...(validatedData.isWorkout !== undefined && {
              isWorkout: validatedData.isWorkout,
            }),
            updatedAt: new Date(),
          })
          .where(eq(workouts.id, trainingDay.workoutId));
      } else {
        // Create new workout
        const newWorkout = await db
          .insert(workouts)
          .values({
            miles: (validatedData.miles ?? 0).toString(),
            description: validatedData.description ?? "Easy Run",
            isWorkout: validatedData.isWorkout ?? false,
          })
          .returning();

        // Link the workout to the training day
        await db
          .update(trainingDays)
          .set({
            workoutId: newWorkout[0].id,
            updatedAt: new Date(),
          })
          .where(eq(trainingDays.id, id));
      }
    }

    // Get the updated training day with workout details
    const updatedTrainingDay = await db.query.trainingDays.findFirst({
      where: eq(trainingDays.id, id),
      with: {
        workout: true,
      },
    });

    return NextResponse.json({
      success: true,
      trainingDay: updatedTrainingDay,
    });
  } catch (error) {
    console.error("Error updating training day:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
