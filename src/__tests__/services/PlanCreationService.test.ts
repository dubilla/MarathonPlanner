import { PlanCreationService } from "@/services/PlanCreationService";

describe("PlanCreationService", () => {
  let service: PlanCreationService;

  beforeEach(() => {
    service = new PlanCreationService();
  });

  describe("createMarathonPlan", () => {
    it("should create an 18-week training plan", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      expect(plan.weeks).toHaveLength(18);
      expect(plan.marathonDate).toEqual(
        marathonDate.toISOString().split("T")[0]
      );
      expect(plan.totalWeeks).toBe(18);
    });

    it("should schedule the longest run on Saturday of Week 16", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      expect(week16).toBeDefined();

      const saturday = week16!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();
      expect(saturday!.description).toBe("Long Run");

      // Week 16 should have the peak weekly mileage
      expect(Number(week16!.targetMileage)).toBe(longestWeeklyMileage);

      // Long run should be 20 miles for peak week when weekly mileage < 60
      expect(Number(saturday!.miles)).toBe(20);
    });

    it("should create 6 running days and 1 rest day per week", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      plan.weeks.forEach(week => {
        expect(week.trainingDays).toHaveLength(7);

        const restDay = week.trainingDays.find(day => day.dayOfWeek === 7);
        expect(restDay).toBeDefined();
        expect(restDay!.description).toContain("Rest");

        const runningDays = week.trainingDays.filter(
          day => day.dayOfWeek !== 7
        );
        expect(runningDays).toHaveLength(6);
      });
    });

    it("should mark Tuesdays and Thursdays as Workout days", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
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
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
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
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      const week17 = plan.weeks.find(week => week.weekNumber === 17);
      const week18 = plan.weeks.find(week => week.weekNumber === 18);

      expect(week16).toBeDefined();
      expect(week17).toBeDefined();
      expect(week18).toBeDefined();

      const week16TotalMiles = week16!.trainingDays.reduce(
        (sum, day) => sum + Number(day.miles),
        0
      );
      const week17TotalMiles = week17!.trainingDays.reduce(
        (sum, day) => sum + Number(day.miles),
        0
      );
      const week18TotalMiles = week18!.trainingDays.reduce(
        (sum, day) => sum + Number(day.miles),
        0
      );

      expect(week17TotalMiles).toBeCloseTo(week16TotalMiles * 0.75, 1);
      expect(week18TotalMiles).toBeCloseTo(week16TotalMiles * 0.4, 1);
    });

    it("should build up mileage with oscillating pattern to peak at Week 16", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const weeklyMileage = plan.weeks
        .slice(0, 16)
        .map(week =>
          week.trainingDays.reduce((sum, day) => sum + Number(day.miles), 0)
        );

      // Week 16 should be the peak
      expect(weeklyMileage[15]).toBe(longestWeeklyMileage); // Week 16 (index 15)

      // First week should be about 50% of peak
      expect(weeklyMileage[0]).toBeGreaterThanOrEqual(
        longestWeeklyMileage * 0.45
      );
      expect(weeklyMileage[0]).toBeLessThanOrEqual(longestWeeklyMileage * 0.55);

      // Should have general upward trend despite oscillation
      const firstHalf = weeklyMileage.slice(0, 8);
      const secondHalf = weeklyMileage.slice(8, 16);
      const firstHalfAvg =
        firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);
    });

    it("should build up long run distance proportionally to weekly mileage", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const longRunMiles = plan.weeks.slice(0, 16).map(week => {
        const saturday = week.trainingDays.find(day => day.dayOfWeek === 6);
        return Number(saturday!.miles);
      });

      // Long runs should generally increase (allowing for some oscillation)
      const firstHalf = longRunMiles.slice(0, 8);
      const secondHalf = longRunMiles.slice(8, 15); // Exclude week 16 since it has fixed distance
      const firstHalfAvg =
        firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);

      // Peak long run (Week 16) should be 20 miles for weekly mileage < 60
      expect(longRunMiles[15]).toBe(20); // Week 16 (index 15)
    });

    it("should calculate correct start date based on marathon date", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 50;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week18 = plan.weeks.find(week => week.weekNumber === 18);
      expect(week18).toBeDefined();

      const week18EndDate = new Date(week18!.startDate);
      week18EndDate.setDate(week18EndDate.getDate() + 6);

      expect(week18EndDate.toDateString()).toBe(marathonDate.toDateString());
    });

    it("should set long run to 22 miles for peak week when weekly mileage is 60+ miles", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 65;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      expect(week16).toBeDefined();

      const saturday = week16!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();
      expect(Number(saturday!.miles)).toBe(22);
    });

    it("should set long run to 20 miles for peak week when weekly mileage is under 60 miles", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 55;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      expect(week16).toBeDefined();

      const saturday = week16!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();
      expect(Number(saturday!.miles)).toBe(20);
    });

    it("should set long run to 22 miles for peak week when weekly mileage is exactly 60 miles", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 60;
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week16 = plan.weeks.find(week => week.weekNumber === 16);
      expect(week16).toBeDefined();

      const saturday = week16!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();
      expect(Number(saturday!.miles)).toBe(22);
    });

    it("should limit Week 17 taper long run to maximum 14 miles", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 70; // High mileage that would normally result in >14 mile taper run
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week17 = plan.weeks.find(week => week.weekNumber === 17);
      expect(week17).toBeDefined();

      const saturday = week17!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();
      expect(Number(saturday!.miles)).toBeLessThanOrEqual(14);
    });

    it("should allow Week 17 taper long run under 14 miles when weekly mileage is low", async () => {
      const marathonDate = new Date("2024-10-15");
      const longestWeeklyMileage = 40; // Lower mileage
      const userId = "user-123";

      const plan = await service.createMarathonPlan({
        marathonDate,
        longestWeeklyMileage,
        userId,
      });

      const week17 = plan.weeks.find(week => week.weekNumber === 17);
      expect(week17).toBeDefined();

      const saturday = week17!.trainingDays.find(day => day.dayOfWeek === 6);
      expect(saturday).toBeDefined();

      // For 40 mile peak, week 17 is 75% = 30 miles, 35% of that is ~10.5 miles
      expect(Number(saturday!.miles)).toBeLessThan(14);
      expect(Number(saturday!.miles)).toBeGreaterThan(8);
    });
  });
});
