import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFullTrainingPlan } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { trainingPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: planId } = await params;
  
  if (!planId) {
    return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
  }

  let plan;
  try {
    plan = await getFullTrainingPlan(planId);
  } catch (error) {
    console.error('Database error fetching training plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training plan' },
      { status: 500 }
    );
  }
  
  if (!plan) {
    return NextResponse.json({ error: 'Training plan not found' }, { status: 404 });
  }
  
  if (plan.userId !== session.user.id) {
    return NextResponse.json({ error: 'You do not have permission to view this plan' }, { status: 403 });
  }
  
  return NextResponse.json({ plan });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: planId } = await params;
  
  if (!planId) {
    return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate input
  const { name, description, marathonDate, goalTime } = body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
  }

  if (!marathonDate || !Date.parse(marathonDate)) {
    return NextResponse.json({ error: 'Valid marathon date is required' }, { status: 400 });
  }

  // Check if plan exists and user owns it
  let existingPlan;
  try {
    existingPlan = await getFullTrainingPlan(planId);
  } catch (error) {
    console.error('Database error fetching training plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training plan' },
      { status: 500 }
    );
  }
  
  if (!existingPlan) {
    return NextResponse.json({ error: 'Training plan not found' }, { status: 404 });
  }
  
  if (existingPlan.userId !== session.user.id) {
    return NextResponse.json({ error: 'You do not have permission to edit this plan' }, { status: 403 });
  }

  // Update the plan
  try {
    const updatedPlan = await db
      .update(trainingPlans)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        marathonDate: marathonDate,
        goalTime: goalTime?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(trainingPlans.id, planId))
      .returning();

    if (updatedPlan.length === 0) {
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    // Return the updated plan with full data
    const fullUpdatedPlan = await getFullTrainingPlan(planId);
    return NextResponse.json({ plan: fullUpdatedPlan });
  } catch (error) {
    console.error('Database error updating training plan:', error);
    return NextResponse.json(
      { error: 'Failed to update training plan' },
      { status: 500 }
    );
  }
}