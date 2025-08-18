import { PlanCreationService } from "@/services/PlanCreationService";

describe("PlanCreationService", () => {
  let service: PlanCreationService;

  beforeEach(() => {
    service = new PlanCreationService();
  });

  describe("createMarathonPlan", () => {
    it("should create an 18-week training plan", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      expect(plan.weeks).toHaveLength(18);
      expect(plan.marathonDate).toEqual(marathonDate.toISOString().split('T')[0]);
      expect(plan.totalWeeks).toBe(18);
    });

    it("should schedule the longest run on Saturday of Week 16", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      expect(week16).toBeDefined();
      
      const saturday = week16!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();
      expect(Number(saturday!.miles)).toBe(longestRunMiles);
    });

    it("should create 6 running days and 1 rest day per week", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      plan.weeks.forEach(week => {
        expect(week.trainingDays).toHaveLength(7);
        
        const restDay = week.trainingDays.find(day => day.dayOfWeek === 7);
        expect(restDay).toBeDefined();
        expect(restDay!.description).toContain("Rest");
        
        const runningDays = week.trainingDays.filter(day => day.dayOfWeek !== 7);
        expect(runningDays).toHaveLength(6);
      });
    });

    it("should mark Tuesdays and Thursdays as Workout days", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      plan.weeks.forEach(week => {
        const tuesday = week.trainingDays.find(day => day.dayOfWeek === 2);
        const thursday = week.trainingDays.find(day => day.dayOfWeek === 4);
        
        expect(tuesday).toBeDefined();
        expect(thursday).toBeDefined();
        expect(tuesday!.description).toContain("Workout");
        expect(thursday!.description).toContain("Workout");
      });
    });

    it("should mark Saturdays as Long Run days", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      plan.weeks.forEach(week => {
        const saturday = week.trainingDays.find(day => day.dayOfWeek === 6);
        expect(saturday).toBeDefined();
        expect(saturday!.description).toContain("Long Run");
      });
    });

    it("should create taper weeks with reduced mileage", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      const week17 = plan.weeks.find(week => week.weekNumber === 17);
      const week18 = plan.weeks.find(week => week.weekNumber === 18);

      expect(week16).toBeDefined();
      expect(week17).toBeDefined();
      expect(week18).toBeDefined();

      const week16TotalMiles = week16!.trainingDays.reduce((sum, day) => sum + Number(day.miles), 0);
      const week17TotalMiles = week17!.trainingDays.reduce((sum, day) => sum + Number(day.miles), 0);
      const week18TotalMiles = week18!.trainingDays.reduce((sum, day) => sum + Number(day.miles), 0);

      expect(week17TotalMiles).toBeCloseTo(week16TotalMiles * 0.8, 1);
      expect(week18TotalMiles).toBeCloseTo(week16TotalMiles * 0.2, 1);
    });

    it("should gradually build up mileage over the weeks", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      const weeklyMileage = plan.weeks.slice(0, 16).map(week => 
        week.trainingDays.reduce((sum, day) => sum + Number(day.miles), 0)
      );

      for (let i = 1; i < weeklyMileage.length - 4; i++) {
        const currentWeek = weeklyMileage[i];
        const previousWeek = weeklyMileage[i - 1];
        
        if (i % 4 !== 0) {
          expect(currentWeek).toBeGreaterThanOrEqual(previousWeek * 0.85);
        }
      }
    });

    it("should gradually build up long run distance", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      const longRunMiles = plan.weeks.slice(0, 16).map(week => {
        const saturday = week.trainingDays.find(day => day.dayOfWeek === 6);
        return Number(saturday!.miles);
      });

      for (let i = 1; i < longRunMiles.length - 3; i++) {
        const currentLongRun = longRunMiles[i];
        const previousLongRun = longRunMiles[i - 1];
        
        expect(currentLongRun).toBeGreaterThanOrEqual(previousLongRun * 0.9);
      }

      expect(Math.max(...longRunMiles)).toBe(longestRunMiles);
    });

    it("should calculate correct start date based on marathon date", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestRunMiles = 20;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestRunMiles,
        userId,
      });

      const week18 = plan.weeks.find(week => week.weekNumber === 18);
      expect(week18).toBeDefined();
      
      const week18EndDate = new Date(week18!.startDate);
      week18EndDate.setDate(week18EndDate.getDate() + 6);
      
      expect(week18EndDate.toDateString()).toBe(marathonDate.toDateString());
    });
  });
});