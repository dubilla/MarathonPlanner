/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/training-days/[id]/route";
import { getServerSession } from "next-auth/next";

// Mock NextRequest properly
global.Request = class Request {
  constructor(
    public url: string,
    public init?: any
  ) {}
  public json = async () => (this.init?.body ? JSON.parse(this.init.body) : {});
} as any;

global.Headers = class Headers {} as any;

jest.mock("next-auth/next");
jest.mock("@/lib/db/queries");

jest.mock("@/lib/db");

jest.mock("@/lib/db/schema", () => ({
  trainingDays: {},
  workouts: {},
  plans: {},
  weeks: {},
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((field, value) => ({ field, value })),
}));

import { db } from "@/lib/db";

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

const mockDb = db as jest.Mocked<typeof db>;

describe("PUT /api/training-days/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock db structure
    (mockDb.query as any) = {
      trainingDays: {
        findFirst: jest.fn(),
      },
    };
    (mockDb.update as any) = jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(),
        })),
      })),
    }));
    (mockDb.insert as any) = jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(),
      })),
    }));
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miles: 5 }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 when training day is not found", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    mockDb.query.trainingDays.findFirst.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miles: 5 }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Training day not found");
  });

  it("should return 403 when user does not own the training plan", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    mockDb.query.trainingDays.findFirst.mockResolvedValueOnce({
      id: "day1",
      week: {
        plan: {
          userId: "different-user",
        },
      },
      workoutId: null,
    });

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miles: 5 }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe(
      "You do not have permission to edit this training day"
    );
  });

  it("should update existing workout when training day has a workout", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    const mockTrainingDay = {
      id: "day1",
      workoutId: "workout1",
      week: {
        plan: {
          userId: "user1",
        },
      },
      workout: {
        id: "workout1",
        miles: "3",
        description: "Easy Run",
        isWorkout: false,
      },
    };

    mockDb.query.trainingDays.findFirst
      .mockResolvedValueOnce(mockTrainingDay)
      .mockResolvedValueOnce({
        ...mockTrainingDay,
        workout: {
          id: "workout1",
          miles: "5",
          description: "Tempo Run",
          isWorkout: true,
        },
      });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        miles: 5,
        description: "Tempo Run",
        isWorkout: true,
      }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should create new workout when training day has no workout", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    const mockTrainingDay = {
      id: "day1",
      workoutId: null,
      week: {
        plan: {
          userId: "user1",
        },
      },
      workout: null,
    };

    mockDb.query.trainingDays.findFirst
      .mockResolvedValueOnce(mockTrainingDay)
      .mockResolvedValueOnce({
        ...mockTrainingDay,
        workoutId: "new-workout-id",
        workout: {
          id: "new-workout-id",
          miles: "8",
          description: "Long Run",
          isWorkout: false,
        },
      });

    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: "new-workout-id" }]),
      }),
    });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        miles: 8,
        description: "Long Run",
        isWorkout: false,
      }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should handle partial updates with only miles", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    const mockTrainingDay = {
      id: "day1",
      workoutId: "workout1",
      week: {
        plan: {
          userId: "user1",
        },
      },
      workout: {
        id: "workout1",
        miles: "3",
        description: "Easy Run",
        isWorkout: false,
      },
    };

    mockDb.query.trainingDays.findFirst
      .mockResolvedValueOnce(mockTrainingDay)
      .mockResolvedValueOnce({
        ...mockTrainingDay,
        workout: {
          ...mockTrainingDay.workout,
          miles: "6",
        },
      });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miles: 6 }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 for invalid request data", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miles: -5 }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });

  it("should handle zero miles for rest days", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: "user1", email: "test@example.com" },
    });

    const mockTrainingDay = {
      id: "day1",
      workoutId: "workout1",
      week: {
        plan: {
          userId: "user1",
        },
      },
      workout: {
        id: "workout1",
        miles: "5",
        description: "Easy Run",
        isWorkout: false,
      },
    };

    mockDb.query.trainingDays.findFirst
      .mockResolvedValueOnce(mockTrainingDay)
      .mockResolvedValueOnce({
        ...mockTrainingDay,
        workout: {
          id: "workout1",
          miles: "0",
          description: "Rest Day",
          isWorkout: false,
        },
      });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const request = new NextRequest("http://localhost/api/training-days/day1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        miles: 0,
        description: "Rest Day",
        isWorkout: false,
      }),
    });

    const response = await PUT(request, { params: { id: "day1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
