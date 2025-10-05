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

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe("Plan Deletion Integration", () => {
  const mockPlanId = "test-plan-id";
  const mockUserId = "test-user-id";

  const mockPlan: PlanWithRelations = {
    id: mockPlanId,
    userId: mockUserId,
    name: "Test Marathon Training Plan",
    description: "18-week marathon training plan",
    marathonDate: "2024-12-31",
    goalTime: "3:30:00",
    totalWeeks: 18,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    weeks: [
      {
        id: "week-1",
        planId: mockPlanId,
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
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          },
        ],
      },
    ],
  };

  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for all tests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("completes the full deletion flow successfully", async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Training plan deleted successfully",
        planId: mockPlanId,
      }),
    });

    // Render the component
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Verify initial state
    expect(screen.getByText("Test Marathon Training Plan")).toBeInTheDocument();
    expect(screen.getByText("Delete Plan")).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByText("Delete Plan");
    fireEvent.click(deleteButton);

    // Verify confirmation dialog appears
    expect(screen.getByText("Delete Training Plan")).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone/i)
    ).toBeInTheDocument();

    // Enter plan name for confirmation
    const confirmationInput = screen.getByPlaceholderText(mockPlan.name);
    fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

    // Verify delete button is enabled
    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete plan/i,
    });
    const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
    expect(confirmDeleteButton).not.toBeDisabled();

    // Confirm deletion
    fireEvent.click(confirmDeleteButton);

    // Verify loading state
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(confirmDeleteButton).toBeDisabled();

    // Wait for API call to complete and verify success
    await waitFor(() => {
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    // Verify the API was called correctly
    expect(global.fetch).toHaveBeenCalledWith(`/api/plans/${mockPlanId}`, {
      method: "DELETE",
    });
  });

  it("handles authorization errors in the full flow", async () => {
    // Mock unauthorized response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Open confirmation dialog
    const deleteButton = screen.getByText("Delete Plan");
    fireEvent.click(deleteButton);

    // Enter plan name and confirm
    const confirmationInput = screen.getByPlaceholderText(mockPlan.name);
    fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete plan/i,
    });
    const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
    fireEvent.click(confirmDeleteButton);

    // Should show authorization error
    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });

    // Should not redirect
    expect(mockOnBack).not.toHaveBeenCalled();
  });

  it("handles permission denied errors in the full flow", async () => {
    // Mock permission denied response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: "You do not have permission to delete this plan",
      }),
    });

    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Attempt deletion
    const deleteButton = screen.getByText("Delete Plan");
    fireEvent.click(deleteButton);

    const confirmationInput = screen.getByPlaceholderText(mockPlan.name);
    fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete plan/i,
    });
    const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
    fireEvent.click(confirmDeleteButton);

    // Should show permission error
    await waitFor(() => {
      expect(
        screen.getByText("You do not have permission to delete this plan")
      ).toBeInTheDocument();
    });

    expect(mockOnBack).not.toHaveBeenCalled();
  });

  it("handles plan not found errors in the full flow", async () => {
    // Mock plan not found response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Training plan not found" }),
    });

    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Attempt deletion
    const deleteButton = screen.getByText("Delete Plan");
    fireEvent.click(deleteButton);

    const confirmationInput = screen.getByPlaceholderText(mockPlan.name);
    fireEvent.change(confirmationInput, { target: { value: mockPlan.name } });

    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete plan/i,
    });
    const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
    fireEvent.click(confirmDeleteButton);

    // Should show not found error
    await waitFor(() => {
      expect(screen.getByText("Training plan not found")).toBeInTheDocument();
    });

    expect(mockOnBack).not.toHaveBeenCalled();
  });

  it("prevents deletion with incorrect plan name confirmation", async () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);

    // Open confirmation dialog
    const deleteButton = screen.getByText("Delete Plan");
    fireEvent.click(deleteButton);

    // Enter incorrect name
    const confirmationInput = screen.getByPlaceholderText(mockPlan.name);
    fireEvent.change(confirmationInput, {
      target: { value: "Wrong Plan Name" },
    });

    // Delete button should remain disabled
    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete plan/i,
    });
    const confirmDeleteButton = allDeleteButtons[1]; // The confirmation dialog button
    expect(confirmDeleteButton).toBeDisabled();

    // Should not make any API calls
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnBack).not.toHaveBeenCalled();
  });
});
