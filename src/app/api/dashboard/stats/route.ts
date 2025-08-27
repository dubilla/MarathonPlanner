import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTrainingPlansByUserId } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's training plans
    const plans = await getTrainingPlansByUserId(session.user.id);
    
    // Calculate stats
    const now = new Date();
    const activePlans = plans.filter(plan => {
      const marathonDate = new Date(plan.marathonDate);
      return marathonDate > now;
    }).length;

    // TODO: Implement actual weekly mileage and streak calculation
    // For now, return placeholder values
    const stats = {
      activePlans,
      weeklyMiles: 0,
      currentStreak: 0
    };
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}