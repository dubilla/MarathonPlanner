import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFullTrainingPlan } from '@/lib/db/queries';

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