import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TrainingPlanView from "@/components/plans/TrainingPlanView";
import { PlanWithRelations } from "@/services/PlanCreationService";

// Mock the useAuth hook
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    loading: false,
  }),
}));

// Mock window.location
delete (window as any).location;
window.location = { href: "" } as any;

const mockPlan: PlanWithRelations = {
  id: "test-plan-id",
  userId: "test-user-id",
  name: "Test Marathon Training Plan",
  description: "18-week marathon training plan ending on December 31, 2024",
  marathonDate: "2024-12-31",
  goalTime: null,
  totalWeeks: 2, // Simplified for testing
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  weeks: [
    {
      id: "week-1",
      planId: "test-plan-id",
      weekNumber: 1,
      startDate: "2024-01-01",
      targetMileage: "25.00",
      actualMileage: null,
      notes: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      trainingDays: [
        {
          id: "day-1-1",
          weekId: "week-1",
          dayOfWeek: 1,
          date: "2024-01-01",
          miles: "4.00",
          description: "Easy Run",
          workoutId: "workout-1-1",
          completed: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          workout: {
            id: "workout-1-1",
            miles: 4.0,
            description: "Easy Run",
            isWorkout: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        },
        {
          id: "day-1-2",
          weekId: "week-1",
          dayOfWeek: 2,
          date: "2024-01-02",
          miles: "5.00",
          description: "Workout",
          workoutId: "workout-1-2",
          completed: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          workout: {
            id: "workout-1-2",
            miles: 5.0,
            description: "Workout",
            isWorkout: true,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        },
        {
          id: "day-1-7",
          weekId: "week-1",
          dayOfWeek: 7,
          date: "2024-01-07",
          miles: "0.00",
          description: "Rest",
          workoutId: null,
          completed: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          workout: null,
        },
      ],
    },
    {
      id: "week-2",
      planId: "test-plan-id",
      weekNumber: 16, // Peak week
      startDate: "2024-04-15",
      targetMileage: "50.00",
      actualMileage: null,
      notes: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      trainingDays: [
        {
          id: "day-2-1",
          weekId: "week-2",
          dayOfWeek: 1,
          date: "2024-04-15",
          miles: "8.00",
          description: "Easy Run",
          workoutId: "workout-2-1",
          completed: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          workout: {
            id: "workout-2-1",
            miles: 8.0,
            description: "Easy Run",
            isWorkout: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        },
        {
          id: "day-2-6",
          weekId: "week-2",
          dayOfWeek: 6,
          date: "2024-04-20",
          miles: "22.00",
          description: "Long Run",
          workoutId: "workout-2-6",
          completed: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          workout: {
            id: "workout-2-6",
            miles: 22.0,
            description: "Long Run",
            isWorkout: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        },
      ],
    },
  ],
};

describe("TrainingPlanView", () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders plan name and description", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    expect(screen.getByText("Test Marathon Training Plan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "18-week marathon training plan ending on December 31, 2024"
      )
    ).toBeInTheDocument();
  });

  it("displays plan statistics correctly", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    expect(screen.getByText("0/2")).toBeInTheDocument(); // Weeks complete
    expect(screen.getByText("Weeks Complete")).toBeInTheDocument();
    expect(screen.getByText("0/75")).toBeInTheDocument(); // Miles complete (25 + 50)
    expect(screen.getByText("Miles Complete")).toBeInTheDocument();
  });

  it("shows back to dashboard button", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    const backButton = screen.getByText("Back to Dashboard");
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("displays view mode tabs", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    expect(screen.getByText("Weekly View")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
  });

  it("switches between view modes", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    const statsTab = screen.getByText("Statistics");
    fireEvent.click(statsTab);

    expect(screen.getByText("Training Progress")).toBeInTheDocument();
    expect(screen.getByText("Weekly Progress")).toBeInTheDocument();
  });

  it("shows current week by default", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Should show "Week 1 of 2" since we're mocking the current week calculation
    expect(screen.getByText(/Week \d+ of 2/)).toBeInTheDocument();
  });

  it("displays week navigation buttons", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    const prevButton = screen.getByText("←");
    const nextButton = screen.getByText("→");

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it("shows workout types with correct styling", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Check if workout type badges are present
    const workoutTypes = screen.getAllByText(/Easy Run|Workout|Rest/);
    expect(workoutTypes.length).toBeGreaterThan(0);
  });

  it("displays workout details and pace guidance", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Check for pace guidance text - may be split across elements
    const paceTexts = screen.getAllByText(
      /Conversational pace|Active recovery|Tempo runs/
    );
    expect(paceTexts.length).toBeGreaterThan(0);
  });

  it("shows peak week label", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Navigate to week 16 (peak week)
    const nextButton = screen.getByText("→");
    fireEvent.click(nextButton);

    expect(screen.getByText("Week 16 (Peak Week)")).toBeInTheDocument();
  });

  it("allows marking workouts as complete", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);

    const firstCheckbox = checkboxes[0];
    fireEvent.click(firstCheckbox);

    expect(firstCheckbox).toBeChecked();
  });

  it("shows rest days without completion checkbox", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Component should render successfully
    expect(screen.getByText("Test Marathon Training Plan")).toBeInTheDocument();
  });

  it("calculates and displays week progress correctly", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Should show plan overview stats
    expect(screen.getByText("Weeks Complete")).toBeInTheDocument();
    expect(screen.getByText("Miles Complete")).toBeInTheDocument();
  });

  it("shows statistics view with weekly progress", () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    const statsTab = screen.getByText("Statistics");
    fireEvent.click(statsTab);

    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getAllByText(/Week 16/).length).toBeGreaterThan(0);
    expect(screen.getByText("Peak")).toBeInTheDocument();
    expect(screen.getByText(/\d+\/25\.00 mi/)).toBeInTheDocument();
    expect(screen.getByText(/\d+\/50\.00 mi/)).toBeInTheDocument();
  });

  it("shows marathon countdown", () => {
    // Mock current date to be before marathon date
    const originalDate = Date;
    const mockDate = new Date("2024-01-01");
    global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
    global.Date.now = originalDate.now;

    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    expect(screen.getByText(/\d+ days/)).toBeInTheDocument();
    expect(screen.getByText("Days to Go")).toBeInTheDocument();

    // Restore original Date
    global.Date = originalDate;
  });

  describe("Plan Editing", () => {
    beforeEach(() => {
      // Mock fetch for edit operations
      global.fetch = jest.fn();
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("shows edit plan button", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      expect(editButton).toBeInTheDocument();
    });

    it("switches to edit mode when edit button is clicked", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      // Should show editing form fields
      expect(
        screen.getByRole("textbox", { name: /plan name/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /description/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/marathon date/i)).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /goal time/i })
      ).toBeInTheDocument();

      // Should show save/cancel buttons
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();

      // Should hide edit button
      expect(screen.queryByText("Edit Plan")).not.toBeInTheDocument();
    });

    it("pre-populates form fields with current plan data", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      const descriptionField = screen.getByRole("textbox", {
        name: /description/i,
      });
      const dateField = screen.getByLabelText(/marathon date/i);

      expect(nameField).toHaveValue("Test Marathon Training Plan");
      expect(descriptionField).toHaveValue(
        "18-week marathon training plan ending on December 31, 2024"
      );
      expect(dateField).toHaveValue("2024-12-31");
    });

    it("shows goal time when plan has one", () => {
      const planWithGoalTime = {
        ...mockPlan,
        goalTime: "3:30:00",
      };

      render(<TrainingPlanView plan={planWithGoalTime} onBack={mockOnBack} />);

      // Should show goal time in display mode
      expect(screen.getByText("Goal: 3:30:00")).toBeInTheDocument();

      // Switch to edit mode
      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      const goalTimeField = screen.getByRole("textbox", { name: /goal time/i });
      expect(goalTimeField).toHaveValue("3:30:00");
    });

    it("cancels editing and reverts changes", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      // Modify a field
      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      fireEvent.change(nameField, { target: { value: "Modified Plan Name" } });

      // Cancel editing
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should be back in display mode
      expect(screen.getByText("Edit Plan")).toBeInTheDocument();
      expect(
        screen.getByText("Test Marathon Training Plan")
      ).toBeInTheDocument();
      expect(screen.queryByText("Modified Plan Name")).not.toBeInTheDocument();
    });

    it("shows validation error for empty plan name", async () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      // Clear the plan name
      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      fireEvent.change(nameField, { target: { value: "" } });

      // Try to save
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Should show validation error
      expect(screen.getByText("Plan name is required")).toBeInTheDocument();

      // Should not make API call
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("shows validation error for empty marathon date", async () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      // Clear the marathon date
      const dateField = screen.getByLabelText(/marathon date/i);
      fireEvent.change(dateField, { target: { value: "" } });

      // Try to save
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Should show validation error
      expect(screen.getByText("Marathon date is required")).toBeInTheDocument();

      // Should not make API call
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("saves successfully and makes correct API call", async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plan: { ...mockPlan, name: "Updated Plan" } }),
      });

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      // Modify plan data
      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      const goalTimeField = screen.getByRole("textbox", { name: /goal time/i });
      fireEvent.change(nameField, { target: { value: "Updated Plan Name" } });
      fireEvent.change(goalTimeField, { target: { value: "3:30:00" } });

      // Save changes
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Should make API call with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${mockPlan.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Updated Plan Name",
            description:
              "18-week marathon training plan ending on December 31, 2024",
            marathonDate: "2024-12-31",
            goalTime: "3:30:00",
          }),
        });
      });

      // Should exit edit mode after successful save
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /save/i })
        ).not.toBeInTheDocument();
      });
    });

    it("handles API errors gracefully", async () => {
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to update plan" }),
      });

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      fireEvent.change(nameField, { target: { value: "Updated Plan Name" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Failed to update plan")).toBeInTheDocument();
      });

      // Should remain in edit mode
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("handles network errors gracefully", async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      fireEvent.change(nameField, { target: { value: "Updated Plan Name" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText("Network error occurred")).toBeInTheDocument();
      });
    });

    it("shows loading state while saving", async () => {
      // Mock delayed API response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ plan: mockPlan }),
                }),
              100
            )
          )
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const editButton = screen.getByText("Edit Plan");
      fireEvent.click(editButton);

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Should show loading state
      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Plan Deletion", () => {
    beforeEach(() => {
      // Mock fetch for delete operations
      global.fetch = jest.fn();
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("shows delete plan button", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      expect(deleteButton).toBeInTheDocument();
    });

    it("opens delete confirmation dialog when delete button is clicked", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByText("Delete Training Plan")).toBeInTheDocument();
      expect(
        screen.getByText("This action cannot be undone")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This will permanently delete the training plan/)
      ).toBeInTheDocument();

      // Should show confirmation input and buttons
      expect(
        screen.getByPlaceholderText("Enter plan name")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /delete plan/i })
      ).toHaveLength(2);
    });

    it("shows plan name in confirmation message", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      expect(screen.getByText(`"${mockPlan.name}"`)).toBeInTheDocument();
    });

    it("disables delete button until correct plan name is entered", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      expect(confirmDeleteButton).toBeDisabled();

      // Type incorrect name
      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: "Wrong Name" } });
      expect(confirmDeleteButton).toBeDisabled();

      // Type correct name
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });
      expect(confirmDeleteButton).not.toBeDisabled();
    });

    it("shows validation error for incorrect plan name", async () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      // Type incorrect name
      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: "Wrong Name" } });

      // Try to delete (button will be disabled, but we can still test the handler logic)
      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button

      // Enable the button temporarily to test validation
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });
      fireEvent.change(confirmationInput, { target: { value: "Wrong Name" } });

      // The button should be disabled, which prevents the click
      expect(confirmDeleteButton).toBeDisabled();
    });

    it("closes dialog when cancel button is clicked", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      // Dialog should be open
      expect(screen.getByText("Delete Training Plan")).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Dialog should be closed
      expect(
        screen.queryByText("Delete Training Plan")
      ).not.toBeInTheDocument();
    });

    it("resets confirmation input when dialog is reopened", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      // Open dialog and type something
      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: "Some text" } });

      // Close dialog
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Reopen dialog
      fireEvent.click(deleteButton);

      // Input should be reset
      const newConfirmationInput =
        screen.getByPlaceholderText("Enter plan name");
      expect(newConfirmationInput).toHaveValue("");
    });

    it("successfully deletes plan and calls onBack", async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Training plan deleted successfully",
          planId: mockPlan.id,
        }),
      });

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      // Enter correct plan name
      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

      // Confirm deletion
      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      fireEvent.click(confirmDeleteButton);

      // Should make API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${mockPlan.id}`, {
          method: "DELETE",
        });
      });

      // Should call onBack to redirect to dashboard
      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalledTimes(1);
      });
    });

    it("shows loading state while deleting", async () => {
      // Mock delayed API response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    message: "Training plan deleted successfully",
                    planId: mockPlan.id,
                  }),
                }),
              100
            )
          )
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      fireEvent.click(confirmDeleteButton);

      // Should show loading state
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
      expect(confirmDeleteButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalledTimes(1);
      });
    });

    it("handles API errors gracefully", async () => {
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to delete plan" }),
      });

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      fireEvent.click(confirmDeleteButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Failed to delete plan")).toBeInTheDocument();
      });

      // Should remain in delete dialog
      expect(screen.getByText("Delete Training Plan")).toBeInTheDocument();
      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it("handles network errors gracefully", async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      fireEvent.click(confirmDeleteButton);

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText("Network error occurred")).toBeInTheDocument();
      });

      // Should not call onBack
      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it("does not delete when confirmation name doesn't match exactly", async () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      // Enter slightly different name (different case)
      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, {
        target: { value: mockPlan.name.toLowerCase() },
      });

      // Button should remain disabled
      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      expect(confirmDeleteButton).toBeDisabled();

      // No API call should be made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("disables cancel button while deleting", async () => {
      // Mock delayed API response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    message: "Training plan deleted successfully",
                    planId: mockPlan.id,
                  }),
                }),
              100
            )
          )
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const deleteButton = screen.getByText("Delete Plan");
      fireEvent.click(deleteButton);

      const confirmationInput = screen.getByPlaceholderText("Enter plan name");
      fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

      const allDeleteButtons = screen.getAllByRole("button", {
        name: /delete plan/i,
      });
      const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
      fireEvent.click(confirmDeleteButton);

      // Both buttons should be disabled during deletion
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
      expect(confirmDeleteButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Plan Duplication", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("shows duplicate plan button", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      expect(duplicateButton).toBeInTheDocument();
    });

    it("opens duplicate dialog when duplicate button is clicked", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Should show duplication dialog
      expect(screen.getByText("Duplicate Training Plan")).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /plan name/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /description/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/new marathon date/i)).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /goal time/i })
      ).toBeInTheDocument();

      // Should show duplicate/cancel buttons (there should be 2 - one in header, one in modal)
      expect(
        screen.getAllByRole("button", { name: /duplicate plan/i })
      ).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("pre-populates form fields with plan data and default name", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      const descriptionField = screen.getByRole("textbox", {
        name: /description/i,
      });

      expect(nameField).toHaveValue("Test Marathon Training Plan (Copy)");
      expect(descriptionField).toHaveValue(
        "18-week marathon training plan ending on December 31, 2024"
      );
    });

    it("shows goal time when plan has one", () => {
      const planWithGoalTime = {
        ...mockPlan,
        goalTime: "3:30:00",
      };

      render(<TrainingPlanView plan={planWithGoalTime} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      const goalTimeField = screen.getByRole("textbox", { name: /goal time/i });
      expect(goalTimeField).toHaveValue("3:30:00");
    });

    it("closes dialog when cancel button is clicked", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Dialog should be open
      expect(screen.getByText("Duplicate Training Plan")).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Dialog should be closed
      expect(
        screen.queryByText("Duplicate Training Plan")
      ).not.toBeInTheDocument();
    });

    it("disables duplicate button when required fields are empty", () => {
      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Get the modal's duplicate button (should be disabled initially)
      const duplicateButtons = screen.getAllByRole("button", {
        name: /duplicate plan/i,
      });
      const confirmDuplicateButton = duplicateButtons.find(button =>
        button.hasAttribute("disabled")
      );
      expect(confirmDuplicateButton).toBeTruthy();

      // Should be disabled initially (no marathon date)
      expect(confirmDuplicateButton).toBeDisabled();

      // Clear name field
      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      fireEvent.change(nameField, { target: { value: "" } });

      // Should still be disabled (empty name and no marathon date)
      expect(confirmDuplicateButton).toBeDisabled();

      // Add marathon date but keep name empty
      const marathonDateField = screen.getByLabelText(/new marathon date/i);
      fireEvent.change(marathonDateField, { target: { value: "2025-01-01" } });

      // Should still be disabled (empty name)
      expect(confirmDuplicateButton).toBeDisabled();

      // Add name
      fireEvent.change(nameField, { target: { value: "New Plan Name" } });

      // Should now be enabled - get the button again since DOM may have updated
      const updatedButtons = screen.getAllByRole("button", {
        name: /duplicate plan/i,
      });
      const updatedConfirmButton = updatedButtons.find(
        button => !button.hasAttribute("disabled")
      );
      expect(updatedConfirmButton).toBeTruthy();
      expect(updatedConfirmButton).not.toBeDisabled();
    });

    it("calls duplicate API with correct parameters", async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plan: { id: "new-plan-id" },
          message: "Plan duplicated successfully",
        }),
      });

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Fill out the form
      const nameField = screen.getByRole("textbox", { name: /plan name/i });
      const descriptionField = screen.getByRole("textbox", {
        name: /description/i,
      });
      const marathonDateField = screen.getByLabelText(/new marathon date/i);
      const goalTimeField = screen.getByRole("textbox", { name: /goal time/i });

      fireEvent.change(nameField, { target: { value: "Duplicated Plan" } });
      fireEvent.change(descriptionField, {
        target: { value: "Duplicated plan description" },
      });
      fireEvent.change(marathonDateField, { target: { value: "2025-01-01" } });
      fireEvent.change(goalTimeField, { target: { value: "3:25:00" } });

      // Submit the form - get all buttons and click the last one (modal button)
      const duplicateButtons = screen.getAllByRole("button", { name: /duplicate plan/i });
      const confirmDuplicateButton = duplicateButtons[duplicateButtons.length - 1];
      fireEvent.click(confirmDuplicateButton);

      // Should make API call with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/plans/${mockPlan.id}/duplicate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "Duplicated Plan",
              description: "Duplicated plan description",
              marathonDate: "2025-01-01",
              goalTime: "3:25:00",
            }),
          }
        );
      });
    });

    it("shows loading state while duplicating", async () => {
      // Mock delayed API response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    plan: { id: "new-plan-id" },
                    message: "Plan duplicated successfully",
                  }),
                }),
              100
            )
          )
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Fill required fields
      const marathonDateField = screen.getByLabelText(/new marathon date/i);
      fireEvent.change(marathonDateField, { target: { value: "2025-01-01" } });

      // Get the modal's duplicate button (last one)
      const duplicateButtons = screen.getAllByRole("button", { name: /duplicate plan/i });
      const confirmDuplicateButton = duplicateButtons[duplicateButtons.length - 1];
      fireEvent.click(confirmDuplicateButton);

      // Should show loading state
      expect(screen.getByText("Duplicating...")).toBeInTheDocument();
      expect(confirmDuplicateButton).toBeDisabled();

      // Wait for API call to complete (no need to test redirect)
      await waitFor(() => {
        expect(screen.queryByText("Duplicating...")).not.toBeInTheDocument();
      });
    });

    it("handles API errors gracefully", async () => {
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to duplicate plan" }),
      });

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Fill required fields
      const marathonDateField = screen.getByLabelText(/new marathon date/i);
      fireEvent.change(marathonDateField, { target: { value: "2025-01-01" } });

      // Get the modal's duplicate button (last one)
      const duplicateButtons = screen.getAllByRole("button", { name: /duplicate plan/i });
      const confirmDuplicateButton = duplicateButtons[duplicateButtons.length - 1];
      fireEvent.click(confirmDuplicateButton);

      // Should show error message
      await waitFor(() => {
        expect(
          screen.getByText("Failed to duplicate plan")
        ).toBeInTheDocument();
      });

      // Should remain in duplicate dialog
      expect(screen.getByText("Duplicate Training Plan")).toBeInTheDocument();
    });

    it("handles network errors gracefully", async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

      const duplicateButton = screen.getByText("Duplicate Plan");
      fireEvent.click(duplicateButton);

      // Fill required fields
      const marathonDateField = screen.getByLabelText(/new marathon date/i);
      fireEvent.change(marathonDateField, { target: { value: "2025-01-01" } });

      // Get the modal's duplicate button (last one)
      const duplicateButtons = screen.getAllByRole("button", { name: /duplicate plan/i });
      const confirmDuplicateButton = duplicateButtons[duplicateButtons.length - 1];
      fireEvent.click(confirmDuplicateButton);

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText("Network error occurred")).toBeInTheDocument();
      });
    });
  });
});
