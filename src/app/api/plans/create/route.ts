import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { savePlan } from "@/lib/db/queries";
import { PlanWithRelations } from "@/services/PlanCreationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan: PlanWithRelations = await request.json();

    // Verify the plan belongs to the authenticated user
    if (plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Save the plan to the database
    const savedPlan = await savePlan(plan);

    return NextResponse.json({ success: true, plan: savedPlan });
  } catch (error) {
    console.error("Failed to create training plan:", error);
    return NextResponse.json(
      { error: "Failed to create training plan" },
      { status: 500 }
    );
  }
}
