import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFullTrainingPlan } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: planId } = await params;
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = await getFullTrainingPlan(planId);
    
    if (!plan) {
      return NextResponse.json({ error: 'Training plan not found' }, { status: 404 });
    }
    
    // Check if user owns this plan
    if (plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to view this plan' }, { status: 403 });
    }
    
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Failed to fetch training plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training plan' },
      { status: 500 }
    );
  }
}