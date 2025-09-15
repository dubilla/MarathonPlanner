"use client";

import { useState } from "react";
import { PlanWithRelations } from "@/services/PlanCreationService";
import { TrainingDay } from "@/types";

interface PlanPreviewProps {
  plan: PlanWithRelations;
  onCreate: () => void;
  onTryAgain: () => void;
  isCreating?: boolean;
  createError?: string | null;
}

const dayNames = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Helper functions to work with new workout structure
const getDayMiles = (day: TrainingDay): number => {
  if (day.workout?.miles) {
    return Number(day.workout.miles);
  }
  // Fallback for legacy format
  return Number((day as any).miles || 0);
};

const getDayDescription = (day: TrainingDay): string => {
  if (day.workout?.description) {
    return day.workout.description;
  }
  // Fallback for legacy format
  return (day as any).description || "Rest";
};

const isWorkoutDay = (day: TrainingDay): boolean => {
  if (day.workout?.isWorkout !== undefined) {
    return day.workout.isWorkout;
  }
  // Fallback for legacy format or check description
  const description = (day as any).description || "";
  return (
    description.toLowerCase().includes("workout") ||
    description.toLowerCase().includes("tempo") ||
    description.toLowerCase().includes("interval") ||
    false
  );
};

export default function PlanPreview({
  plan,
  onCreate,
  onTryAgain,
  isCreating = false,
  createError,
}: PlanPreviewProps) {
  const [activeTab, setActiveTab] = useState<"progression" | "schedule">(
    "progression"
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getWeekSummary = (week: (typeof plan.weeks)[0]) => {
    const totalMiles = week.trainingDays.reduce(
      (sum, day) => sum + getDayMiles(day),
      0
    );
    const longRunDay = week.trainingDays.find(day => day.dayOfWeek === 6);
    const longRunMiles = longRunDay ? getDayMiles(longRunDay) : 0;

    let label = "";
    if (week.weekNumber === 16) {
      label = " (Peak)";
    } else if (week.weekNumber >= 17) {
      label = " (Taper)";
    }

    return {
      totalMiles,
      longRunMiles,
      label,
    };
  };

  // Show all 18 weeks
  const keyWeeks = plan.weeks;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Training Plan Preview
        </h1>
        <h2 className="text-xl font-semibold text-gray-700">{plan.name}</h2>
        <p className="text-gray-600 mt-1">{plan.description}</p>
      </div>

      {/* Plan Overview */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Plan Overview
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-gray-700">Marathon Date:</span>
            <span className="ml-2 text-gray-900">
              {formatDate(plan.marathonDate)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Weeks:</span>
            <span className="ml-2 text-gray-900">{plan.totalWeeks} weeks</span>
          </div>
        </div>
      </div>

      {/* Plan Requirements */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Plan Features
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-green-700">
            <span className="mr-2">✓</span>
            <span>18 weeks total</span>
          </div>
          <div className="flex items-center text-green-700">
            <span className="mr-2">✓</span>
            <span>6 running days per week</span>
          </div>
          <div className="flex items-center text-green-700">
            <span className="mr-2">✓</span>
            <span>1 rest day per week (Sunday)</span>
          </div>
          <div className="flex items-center text-green-700">
            <span className="mr-2">✓</span>
            <span>Tuesday and Thursday workouts</span>
          </div>
          <div className="flex items-center text-green-700">
            <span className="mr-2">✓</span>
            <span>Saturday long runs</span>
          </div>
          <div className="flex items-center text-green-700">
            <span className="mr-2">✓</span>
            <span>Last 2 weeks are taper</span>
          </div>
        </div>
      </div>

      {/* Suggested Plan */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Suggested Plan
        </h3>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("progression")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "progression"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Weekly Progression
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "schedule"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Daily Schedule
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "progression" && (
            <div className="space-y-2">
              {keyWeeks.map(week => {
                const summary = getWeekSummary(week);
                return (
                  <div
                    key={week.id}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                  >
                    <span className="font-medium">
                      Week {week.weekNumber}
                      {summary.label}:
                    </span>
                    <div className="text-right">
                      <span className="text-gray-900">
                        {summary.totalMiles} miles total
                      </span>
                      {summary.longRunMiles > 0 && (
                        <span className="text-gray-600 text-sm ml-2">
                          {week.weekNumber === 18
                            ? "(RACE!)"
                            : `(${summary.longRunMiles} mile long run)`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Complete 18-Week Daily Schedule
              </p>
              {plan.weeks.map(week => {
                const summary = getWeekSummary(week);
                return (
                  <div
                    key={week.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">
                        Week {week.weekNumber}
                        {week.weekNumber === 16 && " (Peak)"}
                        {week.weekNumber >= 17 && " (Taper)"}
                      </h4>
                      <span className="text-gray-600 text-sm font-medium">
                        {summary.totalMiles} miles total
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-sm">
                      {week.trainingDays.map(day => (
                        <div
                          key={day.id}
                          className="text-center p-3 bg-gray-50 rounded"
                        >
                          <div className="font-medium text-gray-900 mb-1">
                            {dayNames[day.dayOfWeek]}
                          </div>
                          <div className="text-gray-600 mb-1">
                            {getDayMiles(day) === 0
                              ? "Rest"
                              : `${getDayMiles(day)} miles`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getDayDescription(day) === "Long Run" &&
                            week.weekNumber === 18
                              ? "RACE!"
                              : getDayDescription(day)}
                            {isWorkoutDay(day) && (
                              <span className="ml-2 text-orange-600">🏃‍♂️</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6">
        {createError && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {createError}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onTryAgain}
            disabled={isCreating}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onCreate}
            disabled={isCreating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
          >
            {isCreating ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
