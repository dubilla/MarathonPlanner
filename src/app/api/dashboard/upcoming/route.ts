import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFullTrainingPlan, getTrainingPlansByUserId } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's training plans
    const plans = await getTrainingPlansByUserId(session.user.id);
    
    // Get active plans (marathon date in the future)
    const now = new Date();
    const activePlans = plans.filter(plan => {
      const marathonDate = new Date(plan.marathonDate);
      return marathonDate > now;
    });

    // Collect upcoming workouts from all active plans
    const upcomingWorkouts = [];
    
    for (const plan of activePlans) {
      const fullPlan = await getFullTrainingPlan(plan.id);
      if (!fullPlan) continue;
      
      // Find upcoming workouts (next 7 days)
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      for (const week of fullPlan.weeks) {
        for (const day of week.trainingDays) {
          const workoutDate = new Date(day.date);
          if (workoutDate >= now && workoutDate <= weekFromNow) {
            upcomingWorkouts.push({
              id: day.id,
              date: day.date,
              dayOfWeek: day.dayOfWeek,
              miles: day.miles,
              description: day.description,
              planName: plan.name,
              planId: plan.id,
              weekNumber: week.weekNumber
            });
          }
        }
      }
    }

    // Sort by date
    upcomingWorkouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({ workouts: upcomingWorkouts });
  } catch (error) {
    console.error('Failed to fetch upcoming workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming workouts' },
      { status: 500 }
    );
  }
}