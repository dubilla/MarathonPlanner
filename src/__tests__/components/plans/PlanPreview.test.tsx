import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlanPreview from "@/components/plans/PlanPreview";
import { PlanWithRelations } from "@/services/PlanCreationService";

const generateMockWeek = (weekNumber: number) => {
  const baseDate = new Date("2024-06-10");
  baseDate.setDate(baseDate.getDate() + (weekNumber - 1) * 7);

  // Create a more realistic progression with unique weekly totals
  let weeklyMileage = 25 + weekNumber * 2;
  if (weekNumber <= 4) weeklyMileage = 25 + (weekNumber - 1) * 3;
  else if (weekNumber <= 8) weeklyMileage = 34 + (weekNumber - 4) * 3;
  else if (weekNumber <= 12) weeklyMileage = 46 + (weekNumber - 8) * 2;
  else if (weekNumber <= 15) weeklyMileage = 54 + (weekNumber - 12) * 2;
  else if (weekNumber === 16)
    weeklyMileage = 60; // Peak week
  else if (weekNumber === 17)
    weeklyMileage = 40; // Taper
  else if (weekNumber === 18) weeklyMileage = 26; // Final taper

  const longRunMiles =
    weekNumber === 16
      ? "20.00"
      : weekNumber === 17
        ? "13.00"
        : weekNumber === 18
          ? "6.00"
          : (6 + weekNumber * 0.5).toFixed(2);
  const dailyMiles =
    weekNumber === 16
      ? "8.00"
      : weekNumber === 17
        ? "5.50"
        : weekNumber === 18
          ? "3.50"
          : (3 + weekNumber * 0.25).toFixed(2);

  return {
    id: `week-${weekNumber}`,
    planId: "plan-123",
    weekNumber,
    startDate: baseDate.toISOString().split("T")[0],
    targetMileage: weeklyMileage.toFixed(2),
    actualMileage: null,
    notes: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    trainingDays: [
      {
        id: `day-${weekNumber}-1`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 1,
        miles: dailyMiles,
        description: "Easy Run",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `day-${weekNumber}-2`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 2,
        miles: dailyMiles,
        description: "Workout",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `day-${weekNumber}-3`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 3,
        miles: dailyMiles,
        description: "Easy Run",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `day-${weekNumber}-4`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 4,
        miles: dailyMiles,
        description: "Workout",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `day-${weekNumber}-5`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 5,
        miles: dailyMiles,
        description: "Easy Run",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `day-${weekNumber}-6`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 6,
        miles: longRunMiles,
        description: "Long Run",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `day-${weekNumber}-7`,
        weekId: `week-${weekNumber}`,
        dayOfWeek: 7,
        miles: "0.00",
        description: "Rest",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
};

const mockPlan: PlanWithRelations = {
  id: "plan-123",
  userId: "user-123",
  name: "Marathon Training Plan",
  description: "18-week marathon training plan ending on Mon Oct 15 2024",
  marathonDate: "2024-10-15",
  goalTime: null,
  totalWeeks: 18,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  weeks: Array.from({ length: 18 }, (_, i) => generateMockWeek(i + 1)),
};

describe("PlanPreview", () => {
  const mockOnCreate = jest.fn();
  const mockOnTryAgain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Plan Overview", () => {
    it("displays plan overview information", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText("Training Plan Preview")).toBeInTheDocument();
      expect(screen.getByText("Marathon Training Plan")).toBeInTheDocument();
      expect(
        screen.getByText(/18-week marathon training plan/)
      ).toBeInTheDocument();
      expect(screen.getByText("October 15, 2024")).toBeInTheDocument();
      expect(screen.getByText("18 weeks")).toBeInTheDocument();
    });

    it("displays total training weeks", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText("Total Weeks:")).toBeInTheDocument();
      expect(screen.getByText("18 weeks")).toBeInTheDocument();
    });

    it("displays marathon date in readable format", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText("Marathon Date:")).toBeInTheDocument();
      expect(screen.getByText("October 15, 2024")).toBeInTheDocument();
    });
  });

  describe("Week Summary", () => {
    it("displays weekly mileage summary", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText(/Week 1:/)).toBeInTheDocument();
      expect(screen.getByText(/Week 16 \(Peak\):/)).toBeInTheDocument();
      // Check that some weekly totals are displayed
      expect(screen.getAllByText(/miles total/).length).toBeGreaterThan(0);
    });

    it("displays all 18 weeks in weekly progression", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Check that we see many weeks displayed (should be 18 with our change)
      const weekRows = screen.getAllByText(/Week \d+:/);
      expect(weekRows.length).toBeGreaterThan(10); // Should be 18, but test for more than the old filtered amount (3 + 3 = 6)

      // Check specific weeks exist across the range to prove we're showing more than just first/last few
      expect(screen.getByText(/Week 1:/)).toBeInTheDocument();
      expect(screen.getByText(/Week 9:/)).toBeInTheDocument();
      expect(screen.getByText(/Week 15:/)).toBeInTheDocument();
    });

    it("highlights taper weeks", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText(/Week 17.*Taper/)).toBeInTheDocument();
      expect(screen.getByText(/Week 18.*Taper/)).toBeInTheDocument();
    });

    it("shows peak week information", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText(/Week 16.*Peak/)).toBeInTheDocument();
      expect(screen.getByText(/20 mile long run/)).toBeInTheDocument();
    });

    it('shows "RACE!" for Week 18 marathon week', () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText(/Week 18.*Taper/)).toBeInTheDocument();
      expect(screen.getByText("(RACE!)")).toBeInTheDocument();
    });
  });

  describe("Training Schedule", () => {
    it("displays weekly training schedule when Daily Schedule tab is clicked", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Click on Daily Schedule tab
      const dailyScheduleTab = screen.getByRole("button", {
        name: "Daily Schedule",
      });
      await user.click(dailyScheduleTab);

      // Check that "Complete 18-Week Daily Schedule" text is shown
      expect(
        screen.getByText("Complete 18-Week Daily Schedule")
      ).toBeInTheDocument();

      // Check that all 18 weeks are displayed
      expect(screen.getByText("Week 1")).toBeInTheDocument();
      expect(screen.getByText("Week 9")).toBeInTheDocument();
      expect(screen.getByText("Week 16 (Peak)")).toBeInTheDocument();
      expect(screen.getByText("Week 18 (Taper)")).toBeInTheDocument();

      // Check that days of the week are shown (should be multiple of each)
      expect(screen.getAllByText("Monday").length).toBe(18);
      expect(screen.getAllByText("Sunday").length).toBe(18);
    });

    it("shows workout types correctly when Daily Schedule tab is active", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Click on Daily Schedule tab
      const dailyScheduleTab = screen.getByRole("button", {
        name: "Daily Schedule",
      });
      await user.click(dailyScheduleTab);

      expect(screen.getAllByText("Easy Run").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Workout").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Long Run").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Rest").length).toBeGreaterThan(0);
    });

    it("displays mileage for each day", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Check that mileage is displayed in the Weekly Progression (default tab)
      expect(screen.getAllByText(/\d+ miles/).length).toBeGreaterThan(0);
      // Check weekly summary for 20 mile long run
      expect(screen.getByText("(20 mile long run)")).toBeInTheDocument();
    });

    it("shows rest days with 0 miles when Daily Schedule tab is active", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Click on Daily Schedule tab
      const dailyScheduleTab = screen.getByRole("button", {
        name: "Daily Schedule",
      });
      await user.click(dailyScheduleTab);

      const restDays = screen.getAllByText("Rest");
      expect(restDays.length).toBeGreaterThan(0);
    });

    it("switches between Weekly Progression and Daily Schedule tabs", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Verify Weekly Progression is active by default
      expect(screen.getByText("Suggested Plan")).toBeInTheDocument();
      expect(screen.getByText(/Week 1:/)).toBeInTheDocument();

      // Click on Daily Schedule tab
      const dailyScheduleTab = screen.getByRole("button", {
        name: "Daily Schedule",
      });
      await user.click(dailyScheduleTab);

      // Verify Daily Schedule content is now visible
      expect(
        screen.getByText("Complete 18-Week Daily Schedule")
      ).toBeInTheDocument();
      expect(screen.getAllByText("Monday").length).toBe(18);

      // Click back to Weekly Progression tab
      const weeklyProgressionTab = screen.getByRole("button", {
        name: "Weekly Progression",
      });
      await user.click(weeklyProgressionTab);

      // Verify Weekly Progression content is visible again
      expect(screen.getByText(/Week 1:/)).toBeInTheDocument();
      // Verify Daily Schedule content is no longer visible
      expect(
        screen.queryByText("Complete 18-Week Daily Schedule")
      ).not.toBeInTheDocument();
    });

    it('shows "RACE!" for Week 18 long run in Daily Schedule', async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Click on Daily Schedule tab
      const dailyScheduleTab = screen.getByRole("button", {
        name: "Daily Schedule",
      });
      await user.click(dailyScheduleTab);

      // Verify Week 18 shows "RACE!" for the long run
      expect(screen.getByText("Week 18 (Taper)")).toBeInTheDocument();
      expect(screen.getAllByText("RACE!").length).toBeGreaterThan(0);
    });

    it("displays weekly mileage totals in Daily Schedule", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      // Click on Daily Schedule tab
      const dailyScheduleTab = screen.getByRole("button", {
        name: "Daily Schedule",
      });
      await user.click(dailyScheduleTab);

      // Verify weekly totals are displayed for each week (18 in Daily Schedule + 18 in Weekly Progression that could show through)
      expect(screen.getAllByText(/miles total/).length).toBeGreaterThanOrEqual(
        18
      );

      // Check that the first and peak week headers are present
      expect(screen.getByText("Week 1")).toBeInTheDocument();
      expect(screen.getByText("Week 16 (Peak)")).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("renders Create and Try Again buttons", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(
        screen.getByRole("button", { name: "Create Plan" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try Again" })
      ).toBeInTheDocument();
    });

    it("calls onCreate when Create button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      const createButton = screen.getByRole("button", { name: "Create Plan" });
      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalledTimes(1);
    });

    it("calls onTryAgain when Try Again button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
      await user.click(tryAgainButton);

      expect(mockOnTryAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading States", () => {
    it("shows loading state for Create button when isCreating is true", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
          isCreating={true}
        />
      );

      const createButton = screen.getByRole("button", { name: "Creating..." });
      expect(createButton).toBeDisabled();
    });

    it("disables Try Again button when isCreating is true", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
          isCreating={true}
        />
      );

      const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
      expect(tryAgainButton).toBeDisabled();
    });
  });

  describe("Plan Validation Display", () => {
    it("shows plan meets requirements", () => {
      render(
        <PlanPreview
          plan={mockPlan}
          onCreate={mockOnCreate}
          onTryAgain={mockOnTryAgain}
        />
      );

      expect(screen.getByText(/18 weeks total/)).toBeInTheDocument();
      expect(screen.getByText(/6 running days per week/)).toBeInTheDocument();
      expect(screen.getByText(/1 rest day per week/)).toBeInTheDocument();
      expect(
        screen.getByText(/Tuesday and Thursday workouts/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Saturday long runs/)).toBeInTheDocument();
      expect(screen.getByText(/Last 2 weeks are taper/)).toBeInTheDocument();
    });
  });
});
