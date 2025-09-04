/**
 * @jest-environment node
 */
import { DELETE } from "@/app/api/plans/[id]/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getFullTrainingPlan } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { trainingPlans } from "@/lib/db/schema";

// Mock dependencies
jest.mock("next-auth");
jest.mock("@/lib/db/queries");
jest.mock("@/lib/db");

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockGetFullTrainingPlan = getFullTrainingPlan as jest.MockedFunction<
  typeof getFullTrainingPlan
>;
const mockDb = {
  delete: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn(),
    }),
  }),
};

// Mock the db module
jest.mocked(db).delete = mockDb.delete;

describe("/api/plans/[id] DELETE", () => {
  const mockPlanId = "plan-123";
  const mockUserId = "user-123";

  const mockRequest = new NextRequest(
    "http://localhost:3000/api/plans/plan-123",
    {
      method: "DELETE",
    }
  );

  const mockParams = Promise.resolve({ id: mockPlanId });

  const mockSession = {
    user: {
      id: mockUserId,
      name: "Test User",
      email: "test@example.com",
    },
  };

  const mockPlan = {
    id: mockPlanId,
    userId: mockUserId,
    name: "Test Marathon Plan",
    description: "Test description",
    marathonDate: "2024-10-15",
    goalTime: "3:30:00",
    totalWeeks: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
    weeks: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if user session has no user id", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as typeof mockSession);

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
    });

    it("should return 400 if plan ID is missing", async () => {
      const emptyParams = Promise.resolve({ id: "" });

      const response = await DELETE(mockRequest, { params: emptyParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Plan ID is required");
    });
  });

  describe("Plan Ownership and Existence", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
    });

    it("should return 404 if plan does not exist", async () => {
      mockGetFullTrainingPlan.mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Training plan not found");
      expect(mockGetFullTrainingPlan).toHaveBeenCalledWith(mockPlanId);
    });

    it("should return 500 if database error occurs while fetching plan", async () => {
      const dbError = new Error("Database connection failed");
      mockGetFullTrainingPlan.mockRejectedValue(dbError);

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch training plan");
    });

    it("should return 403 if user does not own the plan", async () => {
      const otherUsersPlan = { ...mockPlan, userId: "other-user-456" };
      mockGetFullTrainingPlan.mockResolvedValue(
        otherUsersPlan as typeof mockPlan
      );

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You do not have permission to delete this plan");
    });
  });

  describe("Successful Deletion", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan.mockResolvedValue(mockPlan as typeof mockPlan);
    });

    it("should successfully delete the plan and return success message", async () => {
      const mockDeleteResult = [{ id: mockPlanId }];

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(mockDeleteResult),
        }),
      });

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Training plan deleted successfully");
      expect(data.planId).toBe(mockPlanId);

      // Verify the delete operation was called correctly
      expect(mockDb.delete).toHaveBeenCalledWith(trainingPlans);
    });

    it("should return 500 if delete operation fails", async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]), // No rows deleted
        }),
      });

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete plan");
    });

    it("should return 500 if database error occurs during deletion", async () => {
      const dbError = new Error("Delete operation failed");

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(dbError),
        }),
      });

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete training plan");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetFullTrainingPlan.mockResolvedValue(mockPlan as typeof mockPlan);
    });

    it("should handle unexpected errors gracefully", async () => {
      const unexpectedError = new Error("Unexpected error");
      mockDb.delete.mockImplementation(() => {
        throw unexpectedError;
      });

      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete training plan");
    });
  });
});
