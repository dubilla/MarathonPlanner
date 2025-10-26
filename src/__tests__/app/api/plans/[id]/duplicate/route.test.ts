/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/plans/[id]/duplicate/route";
import { getServerSession } from "next-auth";
import { getFullTrainingPlan, savePlan } from "@/lib/db/queries";
import { PlanWithRelations } from "@/services/PlanCreator";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/db/queries", () => ({
  getFullTrainingPlan: jest.fn(),
  savePlan: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockGetFullTrainingPlan = getFullTrainingPlan as jest.MockedFunction<
  typeof getFullTrainingPlan
>;
const mockSavePlan = savePlan as jest.MockedFunction<typeof savePlan>;

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn();
global.crypto = {
  ...global.crypto,
  randomUUID: mockRandomUUID,
};

describe("/api/plans/[id]/duplicate", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  };

  const mockSession = {
    user: mockUser,
  };

  const mockSourcePlan: PlanWithRelations = {
    id: "plan-123",
    userId: "original-user-456",
    name: "Original Plan",
    description: "Original plan description",
    marathonDate: "2024-10-01",
    goalTime: "3:30:00",
    totalWeeks: 18,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    weeks: [
      {
        id: "week-1",
        planId: "plan-123",
        weekNumber: 1,
        startDate: "2024-06-17",
        targetMileage: "25.00",
        actualMileage: "23.50",
        notes: "Good week",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        trainingDays: [
          {
            id: "day-1",
            weekId: "week-1",
            dayOfWeek: 1,
            date: "2024-06-17",
            workoutId: "original-workout-1",
            actualMiles: null,
            actualNotes: null,
            completed: false,
            completedAt: null,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
            workout: {
              id: "original-workout-1",
              miles: "5.00",
              description: "Easy Run",
              isWorkout: false,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
          {
            id: "day-2",
            weekId: "week-1",
            dayOfWeek: 2,
            date: "2024-06-18",
            workoutId: "original-workout-2",
            actualMiles: null,
            actualNotes: null,
            completed: false,
            completedAt: null,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
            workout: {
              id: "original-workout-2",
              miles: "6.00",
              description: "Tempo Workout",
              isWorkout: true,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-01"),
            },
          },
        ],
      },
    ],
  };

  const mockDuplicateRequest = {
    name: "Duplicated Plan",
    description: "Duplicated plan description",
    marathonDate: "2024-11-01",
    goalTime: "3:25:00",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomUUID
      .mockReturnValueOnce("new-plan-id")
      .mockReturnValueOnce("new-week-id")
      .mockReturnValueOnce("new-day-1-id")
      .mockReturnValueOnce("temp-week-id")
      .mockReturnValueOnce("new-day-2-id")
      .mockReturnValueOnce("temp-week-id");
  });

  describe("POST", () => {
    it("should successfully duplicate a plan with correct date adjustments", async () => {
      // Setup
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan
        .mockResolvedValueOnce(mockSourcePlan)
        .mockResolvedValueOnce({
          ...mockSourcePlan,
          id: "new-plan-id",
          userId: mockUser.id,
          name: mockDuplicateRequest.name,
          description: mockDuplicateRequest.description,
          marathonDate: mockDuplicateRequest.marathonDate,
          goalTime: mockDuplicateRequest.goalTime,
        });
      mockSavePlan.mockResolvedValue({
        id: "new-plan-id",
        userId: mockUser.id,
        name: mockDuplicateRequest.name,
        description: mockDuplicateRequest.description,
        marathonDate: mockDuplicateRequest.marathonDate,
        goalTime: mockDuplicateRequest.goalTime,
        totalWeeks: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });

      // Execute
      const response = await POST(request, { params });
      const responseData = await response.json();

      // Verify
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Plan duplicated successfully");
      expect(mockGetFullTrainingPlan).toHaveBeenCalledWith("plan-123");
      expect(mockSavePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          name: mockDuplicateRequest.name,
          description: mockDuplicateRequest.description,
          marathonDate: mockDuplicateRequest.marathonDate,
          goalTime: mockDuplicateRequest.goalTime,
          weeks: expect.arrayContaining([
            expect.objectContaining({
              actualMileage: null, // Progress should be reset
              notes: null, // Notes should be reset
              trainingDays: expect.arrayContaining([
                expect.objectContaining({
                  date: "2024-07-18", // Date should be adjusted (31 days later)
                }),
                expect.objectContaining({
                  date: "2024-07-19", // Date should be adjusted (31 days later)
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it("should return 401 when user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should return 400 when plan ID is missing", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost/api/plans//duplicate", {
        method: "POST",
        body: JSON.stringify(mockDuplicateRequest),
        headers: { "Content-Type": "application/json" },
      });

      const params = Promise.resolve({ id: "" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Plan ID is required");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: "invalid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid JSON");
    });

    it("should return 400 when plan name is missing", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const invalidRequest = {
        ...mockDuplicateRequest,
        name: "",
      };

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(invalidRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Plan name is required");
    });

    it("should return 400 when marathon date is invalid", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const invalidRequest = {
        ...mockDuplicateRequest,
        marathonDate: "invalid-date",
      };

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(invalidRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Valid marathon date is required");
    });

    it("should return 404 when source plan is not found", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost/api/plans/nonexistent/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "nonexistent" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe("Source training plan not found");
    });

    it("should return 500 when database error occurs fetching source plan", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan.mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to fetch source training plan");
    });

    it("should return 500 when database error occurs saving duplicated plan", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan.mockResolvedValue(mockSourcePlan);
      mockSavePlan.mockRejectedValue(new Error("Save operation failed"));

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to duplicate training plan");
    });

    it("should allow duplication of plans from other users", async () => {
      // Test that users can duplicate plans they don't own (for template sharing)
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan
        .mockResolvedValueOnce(mockSourcePlan) // Original plan belongs to different user
        .mockResolvedValueOnce({
          ...mockSourcePlan,
          id: "new-plan-id",
          userId: mockUser.id, // Duplicated plan belongs to current user
        });
      mockSavePlan.mockResolvedValue({
        id: "new-plan-id",
        userId: mockUser.id,
        name: mockDuplicateRequest.name,
        description: mockDuplicateRequest.description,
        marathonDate: mockDuplicateRequest.marathonDate,
        goalTime: mockDuplicateRequest.goalTime,
        totalWeeks: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockSavePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id, // Should be set to current user, not original owner
        })
      );
    });

    it("should handle optional fields correctly", async () => {
      const requestWithoutOptionalFields = {
        name: "Minimal Plan",
        marathonDate: "2024-11-01",
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan
        .mockResolvedValueOnce(mockSourcePlan)
        .mockResolvedValueOnce({
          ...mockSourcePlan,
          id: "new-plan-id",
          userId: mockUser.id,
          name: requestWithoutOptionalFields.name,
          description: null,
          marathonDate: requestWithoutOptionalFields.marathonDate,
          goalTime: null,
        });
      mockSavePlan.mockResolvedValue({
        id: "new-plan-id",
        userId: mockUser.id,
        name: requestWithoutOptionalFields.name,
        description: null,
        marathonDate: requestWithoutOptionalFields.marathonDate,
        goalTime: null,
        totalWeeks: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(requestWithoutOptionalFields),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockSavePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          goalTime: null,
        })
      );
    });

    it("should duplicate workouts with new IDs instead of reusing original workout IDs", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan.mockResolvedValueOnce(mockSourcePlan);
      mockSavePlan.mockResolvedValue({
        id: "new-plan-id",
        userId: mockUser.id,
        name: mockDuplicateRequest.name,
        description: mockDuplicateRequest.description,
        marathonDate: mockDuplicateRequest.marathonDate,
        goalTime: mockDuplicateRequest.goalTime,
        totalWeeks: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        "http://localhost/api/plans/plan-123/duplicate",
        {
          method: "POST",
          body: JSON.stringify(mockDuplicateRequest),
          headers: { "Content-Type": "application/json" },
        }
      );

      const params = Promise.resolve({ id: "plan-123" });
      await POST(request, { params });

      // Verify that savePlan was called
      expect(mockSavePlan).toHaveBeenCalled();

      // Get the plan object that was passed to savePlan
      const savedPlanArg = mockSavePlan.mock.calls[0][0];

      // Verify that training days have workout data as legacy properties
      const firstDay = savedPlanArg.weeks[0].trainingDays[0];
      const secondDay = savedPlanArg.weeks[0].trainingDays[1];

      // Verify workout data is included as legacy miles/description properties
      // (savePlan will use these to create new workout records)
      expect(firstDay.miles).toBe("5.00");
      expect(firstDay.description).toBe("Easy Run");

      expect(secondDay.miles).toBe("6.00");
      expect(secondDay.description).toBe("Tempo Workout");

      // Verify that workoutId is null (savePlan will create new workout records)
      expect(firstDay.workoutId).toBeNull();
      expect(secondDay.workoutId).toBeNull();
    });
  });
});
