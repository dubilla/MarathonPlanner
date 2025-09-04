import { render, screen, waitFor } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import PlanViewPage from "@/app/plans/[id]/page";
import {
  mockUseSession,
  createAuthenticatedSession,
  createUnauthenticatedSession,
  createLoadingSession,
} from "../../../utils/auth-test-utils";

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock the TrainingPlanView component
jest.mock("@/components/plans/TrainingPlanView", () => {
  return function MockTrainingPlanView({
    plan,
    onBack,
  }: {
    plan: { name: string; description: string };
    onBack: () => void;
  }) {
    return (
      <div data-testid="training-plan-view">
        <h1>{plan.name}</h1>
        <p>{plan.description}</p>
        <button onClick={onBack}>Back to Dashboard</button>
      </div>
    );
  };
});

// Mock Next.js Link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockPlan = {
  id: "test-plan-id",
  userId: "test-user-id",
  name: "Test Marathon Training Plan",
  description: "18-week marathon training plan",
  marathonDate: "2024-12-31",
  goalTime: null,
  totalWeeks: 18,
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
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ],
    },
  ],
};

describe("Plans [id] Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>);

    mockUseParams.mockReturnValue({ id: "test-plan-id" });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(
        createAuthenticatedSession({
          id: "test-user-id",
          name: "John Runner",
          email: "john@example.com",
        })
      );
    });

    it("displays loading state initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<PlanViewPage />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("displays plan when successfully loaded", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: mockPlan }),
      } as Response);

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Test Marathon Training Plan")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText("18-week marathon training plan")
      ).toBeInTheDocument();
      expect(screen.getByTestId("training-plan-view")).toBeInTheDocument();
    });

    it("handles plan not found error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      expect(screen.getByText("Training plan not found")).toBeInTheDocument();
      expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    });

    it("handles permission denied error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      expect(
        screen.getByText("You do not have permission to view this plan")
      ).toBeInTheDocument();
    });

    it("handles database fetch error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Failed to load training plan")
      ).toBeInTheDocument();
    });

    it("navigates back to dashboard when back button clicked", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: mockPlan }),
      } as Response);

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Test Marathon Training Plan")
        ).toBeInTheDocument();
      });

      const backButton = screen.getByText("Back to Dashboard");
      backButton.click();

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates back to dashboard from error state", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(screen.getByText("Training plan not found")).toBeInTheDocument();
      });

      const backButton = screen.getByText("Back to Dashboard");
      backButton.click();

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("handles invalid plan ID parameter", () => {
      mockUseParams.mockReturnValue({ id: undefined });

      render(<PlanViewPage />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles array plan ID parameter", () => {
      mockUseParams.mockReturnValue({ id: ["multiple", "ids"] });

      render(<PlanViewPage />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createUnauthenticatedSession());
    });

    it("shows protected route behavior", () => {
      render(<PlanViewPage />);

      // ProtectedRoute should handle the redirect, so we don't see the plan content
      expect(
        screen.queryByText("Test Marathon Training Plan")
      ).not.toBeInTheDocument();
    });
  });

  describe("when authentication is loading", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createLoadingSession());
    });

    it("does not fetch plan data while auth is loading", () => {
      render(<PlanViewPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(
        createAuthenticatedSession({
          id: "test-user-id",
          name: "John Runner",
          email: "john@example.com",
        })
      );
    });

    it("only fetches plan data once user is authenticated", async () => {
      // Start with loading auth
      mockUseSession.mockReturnValue(createLoadingSession());

      const { rerender } = render(<PlanViewPage />);

      expect(mockFetch).not.toHaveBeenCalled();

      // Auth completes
      mockUseSession.mockReturnValue(
        createAuthenticatedSession({
          id: "test-user-id",
          name: "John Runner",
          email: "john@example.com",
        })
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: mockPlan }),
      } as Response);

      rerender(<PlanViewPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/plans/test-plan-id");
      });
    });

    it("passes correct props to TrainingPlanView component", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ plan: mockPlan }),
      } as Response);

      render(<PlanViewPage />);

      await waitFor(() => {
        expect(screen.getByTestId("training-plan-view")).toBeInTheDocument();
      });

      // The mock component displays the plan data, confirming correct props
      expect(
        screen.getByText("Test Marathon Training Plan")
      ).toBeInTheDocument();
      expect(
        screen.getByText("18-week marathon training plan")
      ).toBeInTheDocument();
    });
  });
});
