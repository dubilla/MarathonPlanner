import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import PlansPage from "@/app/plans/page";

// Mock the useAuth hook
jest.mock("@/hooks/useAuth");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
  back: jest.fn(),
  forward: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => mockRouter),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockPlans = [
  {
    id: "plan-1",
    name: "Sub 3:30 Marathon Plan",
    description: "Intermediate level plan",
    marathonDate: "2024-10-15",
    goalTime: "3:30:00",
    totalWeeks: 18,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "plan-2",
    name: "First Marathon Plan",
    description: null,
    marathonDate: "2024-12-01",
    goalTime: null,
    totalWeeks: 20,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
];

describe("PlansPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    (confirm as jest.Mock).mockClear();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("renders loading state initially", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<PlansPage />);

    expect(
      screen.getByText("Loading your training plans...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "My Training Plans" })
    ).toBeInTheDocument();
  });

  it("renders plans when fetch is successful", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Sub 3:30 Marathon Plan")).toBeInTheDocument();
    });

    expect(screen.getByText("First Marathon Plan")).toBeInTheDocument();
    expect(screen.getByText("Intermediate level plan")).toBeInTheDocument();
    expect(screen.getByText("Goal: 3:30:00")).toBeInTheDocument();
    expect(screen.getByText("18 weeks")).toBeInTheDocument();
    expect(screen.getByText("20 weeks")).toBeInTheDocument();
  });

  it("displays marathon dates correctly", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });

    render(<PlansPage />);

    await waitFor(() => {
      const marathonDates = screen.getAllByText(/Marathon:.*2024/);
      expect(marathonDates).toHaveLength(2);
    });
  });

  it("renders View Plan links for each plan", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });

    render(<PlansPage />);

    await waitFor(() => {
      const viewPlanLinks = screen.getAllByText("View Plan");
      expect(viewPlanLinks).toHaveLength(2);
    });

    const viewPlanLinks = screen.getAllByText("View Plan");
    expect(viewPlanLinks[0]).toHaveAttribute("href", "/plans/plan-1");
    expect(viewPlanLinks[1]).toHaveAttribute("href", "/plans/plan-2");
  });

  it("renders Create New Plan button", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });

    render(<PlansPage />);

    const createButton = screen.getByRole("link", { name: "Create New Plan" });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute("href", "/plans/new");
  });

  it("handles delete plan functionality", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans: mockPlans }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Plan deleted successfully" }),
      });

    (confirm as jest.Mock).mockReturnValue(true);

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Sub 3:30 Marathon Plan")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Sub 3:30 Marathon Plan"? This action cannot be undone.'
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/plans/plan-1", {
        method: "DELETE",
      });
    });
  });

  it("shows deleting state when delete is in progress", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans: mockPlans }),
      })
      .mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({}) }),
              1000
            )
          )
      );

    (confirm as jest.Mock).mockReturnValue(true);

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Sub 3:30 Marathon Plan")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
  });

  it("cancels delete when user clicks cancel", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });

    (confirm as jest.Mock).mockReturnValue(false);

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Sub 3:30 Marathon Plan")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(confirm).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1); // Only the initial fetch, not the delete
  });

  it("shows error state when fetch fails", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load plans")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to load training plans")
    ).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("shows error state when fetch returns non-ok response", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load plans")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Failed to load training plans")
    ).toBeInTheDocument();
  });

  it("calls router.refresh when Try Again button is clicked", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load plans")).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no plans exist", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: [] }),
    });

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("No training plans yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Get started by creating your first marathon training plan. Our system will generate a personalized 18-week plan tailored to your goals."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create Your First Plan" })
    ).toHaveAttribute("href", "/plans/new");
  });

  it("shows edit functionality placeholder", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });

    // Mock alert
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Sub 3:30 Marathon Plan")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(alertSpy).toHaveBeenCalledWith("Edit functionality coming soon!");

    alertSpy.mockRestore();
  });

  // Note: Testing unauthenticated state is complex due to ProtectedRoute navigation
  // This is covered by ProtectedRoute's own tests

  it("handles delete error gracefully", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
      loading: false,
      signOut: jest.fn(),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans: mockPlans }),
      })
      .mockRejectedValueOnce(new Error("Delete failed"));

    (confirm as jest.Mock).mockReturnValue(true);

    // Mock alert
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText("Sub 3:30 Marathon Plan")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Failed to delete plan. Please try again."
      );
    });

    alertSpy.mockRestore();
  });
});
