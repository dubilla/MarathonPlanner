import { TrainingPlan, TrainingWeek, TrainingDay } from "@/lib/db/schema";

export interface CreateMarathonPlanInput {
  marathonDate: Date;
  longestRunMiles: number;
  userId: string;
}

export type PlanWithRelations = TrainingPlan & {
  weeks: (TrainingWeek & {
    trainingDays: TrainingDay[];
  })[];
};

export class PlanCreationService {
  async createMarathonPlan(input: CreateMarathonPlanInput): Promise<PlanWithRelations> {
    const { marathonDate, longestRunMiles, userId } = input;
    
    const plan = this.generatePlan(marathonDate, longestRunMiles, userId);
    
    return plan;
  }

  private generatePlan(marathonDate: Date, longestRunMiles: number, userId: string): PlanWithRelations {
    const totalWeeks = 18;
    
    const planStartDate = new Date(marathonDate);
    planStartDate.setDate(planStartDate.getDate() - (totalWeeks * 7) + 1);

    const plan: PlanWithRelations = {
      id: crypto.randomUUID(),
      userId,
      name: `Marathon Training Plan`,
      description: `18-week marathon training plan ending on ${marathonDate.toDateString()}`,
      marathonDate: marathonDate.toISOString().split('T')[0],
      goalTime: null,
      totalWeeks,
      createdAt: new Date(),
      updatedAt: new Date(),
      weeks: []
    };

    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      const weekStartDate = new Date(planStartDate);
      weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

      const week = this.generateWeek(weekNum, weekStartDate, longestRunMiles, plan.id);
      plan.weeks.push(week);
    }

    return plan;
  }

  private generateWeek(
    weekNumber: number, 
    startDate: Date, 
    longestRunMiles: number, 
    planId: string
  ): TrainingWeek & { trainingDays: TrainingDay[] } {
    const isWeek17 = weekNumber === 17;
    const isWeek18 = weekNumber === 18;
    
    let weeklyMileage: number;
    let longRunMiles: number;

    if (isWeek18) {
      weeklyMileage = this.calculateWeek18Mileage(longestRunMiles);
      longRunMiles = this.calculateLongRunMiles(weekNumber, longestRunMiles);
    } else if (isWeek17) {
      const week16Mileage = this.calculateWeeklyMileage(16, longestRunMiles);
      weeklyMileage = week16Mileage * 0.8;
      longRunMiles = this.calculateLongRunMiles(weekNumber, longestRunMiles);
    } else {
      weeklyMileage = this.calculateWeeklyMileage(weekNumber, longestRunMiles);
      longRunMiles = this.calculateLongRunMiles(weekNumber, longestRunMiles);
    }

    const week: TrainingWeek & { trainingDays: TrainingDay[] } = {
      id: crypto.randomUUID(),
      planId,
      weekNumber,
      startDate: startDate.toISOString().split('T')[0],
      targetMileage: weeklyMileage.toFixed(2),
      actualMileage: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      trainingDays: []
    };

    const remainingMiles = weeklyMileage - longRunMiles;
    const dailyMiles = remainingMiles / 5;

    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const trainingDay = this.generateTrainingDay(
        dayOfWeek, 
        dailyMiles, 
        longRunMiles, 
        week.id
      );
      week.trainingDays.push(trainingDay);
    }

    return week;
  }

  private generateTrainingDay(
    dayOfWeek: number, 
    dailyMiles: number, 
    longRunMiles: number, 
    weekId: string
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

    return {
      id: crypto.randomUUID(),
      weekId,
      dayOfWeek,
      miles: miles.toFixed(2),
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateWeeklyMileage(weekNumber: number, longestRunMiles: number): number {
    const baseWeeklyMileage = longestRunMiles * 2.5;
    
    if (weekNumber <= 4) {
      return baseWeeklyMileage * 0.6 + (weekNumber - 1) * (baseWeeklyMileage * 0.1);
    } else if (weekNumber <= 8) {
      return baseWeeklyMileage * 0.7 + (weekNumber - 5) * (baseWeeklyMileage * 0.05);
    } else if (weekNumber <= 12) {
      return baseWeeklyMileage * 0.8 + (weekNumber - 9) * (baseWeeklyMileage * 0.03);
    } else if (weekNumber <= 16) {
      return baseWeeklyMileage * 0.9 + (weekNumber - 13) * (baseWeeklyMileage * 0.025);
    }
    
    return baseWeeklyMileage;
  }

  private calculateWeek18Mileage(longestRunMiles: number): number {
    const week16Mileage = this.calculateWeeklyMileage(16, longestRunMiles);
    return week16Mileage * 0.2;
  }

  private calculateLongRunMiles(weekNumber: number, longestRunMiles: number): number {
    if (weekNumber === 16) {
      return longestRunMiles;
    }
    
    if (weekNumber === 17) {
      return longestRunMiles * 0.65;
    }
    
    if (weekNumber === 18) {
      return longestRunMiles * 0.3;
    }
    
    if (weekNumber <= 4) {
      return 8 + (weekNumber - 1) * 2;
    } else if (weekNumber <= 8) {
      return 14 + (weekNumber - 5) * 1;
    } else if (weekNumber <= 12) {
      return 18 + (weekNumber - 9) * 0.5;
    } else if (weekNumber <= 15) {
      const progressToLongest = (weekNumber - 13) / 3;
      return 20 + progressToLongest * (longestRunMiles - 20);
    }
    
    return longestRunMiles;
  }
}