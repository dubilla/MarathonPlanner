import { TrainingPlan, TrainingWeek, TrainingDay } from "@/lib/db/schema";

export interface CreateMarathonPlanInput {
  marathonDate: Date;
  longestWeeklyMileage: number;
  userId: string;
}

export type PlanWithRelations = TrainingPlan & {
  weeks: (TrainingWeek & {
    trainingDays: (TrainingDay & {
      workout?:
        | {
            id: string;
            miles: string;
            description: string;
            isWorkout: boolean;
            createdAt: Date;
            updatedAt: Date;
          }
        | null;
    })[];
  })[];
};

export class PlanCreationService {
  async createMarathonPlan(
    input: CreateMarathonPlanInput
  ): Promise<PlanWithRelations> {
    const { marathonDate, longestWeeklyMileage, userId } = input;

    const plan = this.generatePlan(marathonDate, longestWeeklyMileage, userId);

    return plan;
  }

  private generatePlan(
    marathonDate: Date,
    peakWeeklyMileage: number,
    userId: string
  ): PlanWithRelations {
    const totalWeeks = 18;

    const planStartDate = new Date(marathonDate);
    planStartDate.setDate(planStartDate.getDate() - totalWeeks * 7 + 1);

    const plan: PlanWithRelations = {
      id: crypto.randomUUID(),
      userId,
      name: `Marathon Training Plan`,
      description: `18-week marathon training plan ending on ${marathonDate.toDateString()}`,
      marathonDate: marathonDate.toISOString().split("T")[0],
      goalTime: null,
      totalWeeks,
      createdAt: new Date(),
      updatedAt: new Date(),
      weeks: [],
    };

    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      const weekStartDate = new Date(planStartDate);
      weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

      const week = this.generateWeek(
        weekNum,
        weekStartDate,
        peakWeeklyMileage,
        plan.id
      );
      plan.weeks.push(week);
    }

    return plan;
  }

  private generateWeek(
    weekNumber: number,
    startDate: Date,
    peakWeeklyMileage: number,
    planId: string
  ): TrainingWeek & { trainingDays: TrainingDay[] } {
    // Calculate weekly mileage with Week 16 as peak
    const weeklyMileage = this.calculateWeeklyMileage(
      weekNumber,
      peakWeeklyMileage
    );
    const longRunMiles = this.calculateLongRunMiles(
      weekNumber,
      peakWeeklyMileage
    );

    const week: TrainingWeek & { trainingDays: TrainingDay[] } = {
      id: crypto.randomUUID(),
      planId,
      weekNumber,
      startDate: startDate.toISOString().split("T")[0],
      targetMileage: weeklyMileage.toFixed(2),
      actualMileage: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      trainingDays: [],
    };

    const remainingMiles = weeklyMileage - longRunMiles;
    const dailyMiles = remainingMiles / 5;

    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const trainingDay = this.generateTrainingDay(
        dayOfWeek,
        dailyMiles,
        longRunMiles,
        week.id,
        startDate
      );
      week.trainingDays.push(trainingDay);
    }

    return week;
  }

  private generateTrainingDay(
    dayOfWeek: number,
    dailyMiles: number,
    longRunMiles: number,
    weekId: string,
    weekStartDate: Date
  ): TrainingDay {
    let miles: number;
    let description: string;

    switch (dayOfWeek) {
      case 1: // Monday
        miles = dailyMiles;
        description = "Easy Run";
        break;
      case 2: // Tuesday
        miles = dailyMiles;
        description = "Workout";
        break;
      case 3: // Wednesday
        miles = dailyMiles;
        description = "Easy Run";
        break;
      case 4: // Thursday
        miles = dailyMiles;
        description = "Workout";
        break;
      case 5: // Friday
        miles = dailyMiles;
        description = "Easy Run";
        break;
      case 6: // Saturday
        miles = longRunMiles;
        description = "Long Run";
        break;
      case 7: // Sunday
        miles = 0;
        description = "Rest";
        break;
      default:
        miles = 0;
        description = "Rest";
    }

    // Calculate the date for this specific day
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + (dayOfWeek - 1));

    // Create training day with legacy miles/description for savePlan compatibility
    return {
      id: crypto.randomUUID(),
      weekId,
      dayOfWeek,
      date: dayDate.toISOString().split("T")[0],
      workoutId: null,
      actualMiles: null,
      actualNotes: null,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Legacy properties for savePlan function compatibility
      miles: miles.toFixed(2),
      description,
    } as TrainingDay;
  }

  private calculateWeeklyMileage(
    weekNumber: number,
    peakWeeklyMileage: number
  ): number {
    // Week 16 is the peak week
    if (weekNumber === 16) {
      return peakWeeklyMileage;
    }

    // Taper weeks (17 and 18)
    if (weekNumber === 17) {
      return peakWeeklyMileage * 0.75; // 75% of peak
    }

    if (weekNumber === 18) {
      return peakWeeklyMileage * 0.4; // 40% of peak (marathon week)
    }

    // Build-up weeks (1-15) with oscillating pattern
    // Start at 50% of peak, build to 100% by week 16
    const buildWeeks = 15;
    const progress = (weekNumber - 1) / buildWeeks; // 0 to 1

    // Base progression from 50% to 95% (we'll reach 100% in week 16)
    const baseProgress = 0.5 + progress * 0.45;

    // Add oscillation: every 3 weeks, dip down slightly
    let oscillation = 0;
    const cyclePosition = (weekNumber - 1) % 3;
    if (cyclePosition === 2) {
      // Every 3rd week (weeks 3, 6, 9, 12, 15)
      oscillation = -0.1; // Dip 10% for recovery
    } else if (cyclePosition === 1) {
      // Week after recovery
      oscillation = 0.05; // Slight boost
    }

    const finalProgress = Math.max(
      0.5,
      Math.min(0.95, baseProgress + oscillation)
    );
    return Math.round(peakWeeklyMileage * finalProgress);
  }

  private calculateLongRunMiles(
    weekNumber: number,
    peakWeeklyMileage: number
  ): number {
    // Special case for peak week (Week 16) - set specific long run distance
    if (weekNumber === 16) {
      return peakWeeklyMileage >= 60 ? 22 : 20;
    }

    // The long run should be about 30-40% of weekly mileage
    const weeklyMileage = this.calculateWeeklyMileage(
      weekNumber,
      peakWeeklyMileage
    );

    // Special cases for taper weeks
    if (weekNumber === 17) {
      const taperLongRun = Math.round(weeklyMileage * 0.35); // Conservative long run during taper
      return Math.min(taperLongRun, 14); // Cap at 14 miles maximum
    }

    if (weekNumber === 18) {
      return Math.round(weeklyMileage * 0.25); // Very short run during marathon week
    }

    // For build-up weeks, long run is 35-40% of weekly mileage
    const longRunPercentage = 0.35 + (weekNumber / 16) * 0.05; // Gradually increase from 35% to 40%
    return Math.round(weeklyMileage * longRunPercentage);
  }
}
