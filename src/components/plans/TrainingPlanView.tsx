"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanWithRelations } from "@/services/PlanCreationService";

interface TrainingPlanViewProps {
  plan: PlanWithRelations;
  onBack: () => void;
}

interface WorkoutProgress {
  dayId: string;
  completed: boolean;
  actualMiles?: number;
  notes?: string;
  completedAt?: Date;
}

type ViewMode = "weekly" | "calendar" | "stats";

// Define types for the day objects that can have either workout relations or legacy properties
type TrainingDayWithData = PlanWithRelations["weeks"][0]["trainingDays"][0] & {
  // Legacy properties that might exist
  miles?: string;
  description?: string;
};

// Helper functions to work with new workout structure
const getDayMiles = (day: TrainingDayWithData): number => {
  if (day.workout?.miles) {
    return Number(day.workout.miles);
  }
  // Fallback for legacy format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Number((day as any).miles || 0);
};

const getDayDescription = (day: TrainingDayWithData): string => {
  if (day.workout?.description) {
    return day.workout.description;
  }
  // Fallback for legacy format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (day as any).description || "Rest";
};

const isWorkoutDay = (day: TrainingDayWithData): boolean => {
  if (day.workout?.isWorkout !== undefined) {
    return day.workout.isWorkout;
  }
  // Fallback for legacy format or check description
  const desc = day.description;
  return (
    desc?.toLowerCase().includes("workout") ||
    desc?.toLowerCase().includes("tempo") ||
    desc?.toLowerCase().includes("interval") ||
    false
  );
};

export default function TrainingPlanView({
  plan,
  onBack,
}: TrainingPlanViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workoutProgress, setWorkoutProgress] = useState<
    Record<string, WorkoutProgress>
  >({});
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState({
    name: plan.name,
    description: plan.description || "",
    marathonDate: plan.marathonDate,
    goalTime: plan.goalTime || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateForm, setDuplicateForm] = useState({
    name: `${plan.name} (Copy)`,
    description: plan.description || "",
    marathonDate: "",
    goalTime: plan.goalTime || "",
  });
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayData, setEditingDayData] = useState<{
    miles: number;
    description: string;
    isWorkout: boolean;
  } | null>(null);
  const [savingDayId, setSavingDayId] = useState<string | null>(null);
  const [dayEditError, setDayEditError] = useState<string | null>(null);
  const [loggingDayId, setLoggingDayId] = useState<string | null>(null);
  const [loggingData, setLoggingData] = useState<{
    actualMiles: number;
    actualNotes: string;
  } | null>(null);
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editedPlan.name.trim()) {
      setEditError("Plan name is required");
      return;
    }

    if (!editedPlan.marathonDate) {
      setEditError("Marathon date is required");
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedPlan),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setEditError(errorData.error || "Failed to update plan");
        return;
      }

      router.refresh();
    } catch {
      setEditError("Network error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPlan({
      name: plan.name,
      description: plan.description || "",
      marathonDate: plan.marathonDate,
      goalTime: plan.goalTime || "",
    });
    setEditError(null);
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== plan.name) {
      setDeleteError("Plan name does not match");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDeleteError(errorData.error || "Failed to delete plan");
        return;
      }

      onBack();
    } catch {
      setDeleteError("Network error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateForm.name.trim()) {
      setDuplicateError("Plan name is required");
      return;
    }

    if (!duplicateForm.marathonDate) {
      setDuplicateError("Marathon date is required");
      return;
    }

    setIsDuplicating(true);
    setDuplicateError(null);

    try {
      const response = await fetch(`/api/plans/${plan.id}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDuplicateError(errorData.error || "Failed to duplicate plan");
        return;
      }

      const newPlan = await response.json();
      router.push(`/plans/${newPlan.id}`);
    } catch {
      setDuplicateError("Network error occurred");
    } finally {
      setIsDuplicating(false);
    }
  };

  const closeDuplicateDialog = () => {
    setShowDuplicateDialog(false);
    setDuplicateForm({
      name: `${plan.name} (Copy)`,
      description: plan.description || "",
      marathonDate: "",
      goalTime: plan.goalTime || "",
    });
    setDuplicateError(null);
  };

  const handleEditDay = (day: TrainingDayWithData) => {
    const miles = getDayMiles(day);
    const description = getDayDescription(day);
    const isWorkout = isWorkoutDay(day);

    setEditingDayId(day.id);
    setEditingDayData({ miles, description, isWorkout });
    setDayEditError(null);
  };

  const handleSaveDay = async (dayId: string) => {
    if (!editingDayData) return;

    setSavingDayId(dayId);
    setDayEditError(null);

    try {
      const response = await fetch(`/api/training-days/${dayId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          miles: editingDayData.miles,
          description: editingDayData.description,
          isWorkout: editingDayData.isWorkout,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDayEditError(errorData.error || "Failed to update training day");
        return;
      }

      setEditingDayId(null);
      setEditingDayData(null);
      router.refresh();
    } catch {
      setDayEditError("Network error occurred");
    } finally {
      setSavingDayId(null);
    }
  };

  const handleCancelDayEdit = () => {
    setEditingDayId(null);
    setEditingDayData(null);
    setDayEditError(null);
  };

  const handleStartLogging = (day: TrainingDayWithData) => {
    const miles = getDayMiles(day);
    const description = getDayDescription(day);
    const isWorkout = isWorkoutDay(day);

    setLoggingDayId(day.id);
    setLoggingData({
      actualMiles: day.actualMiles ? Number(day.actualMiles) : miles,
      actualNotes: day.actualNotes || (isWorkout ? description : ""),
    });
    setLogError(null);
  };

  const handleSaveLog = async (dayId: string) => {
    if (!loggingData) return;

    setSavingLogId(dayId);
    setLogError(null);

    try {
      const response = await fetch(`/api/training-days/${dayId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actualMiles: loggingData.actualMiles,
          actualNotes: loggingData.actualNotes,
          completed: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setLogError(errorData.error || "Failed to log training day");
        return;
      }

      setLoggingDayId(null);
      setLoggingData(null);
      router.refresh();
    } catch {
      setLogError("Network error occurred");
    } finally {
      setSavingLogId(null);
    }
  };

  const handleCancelLog = () => {
    setLoggingDayId(null);
    setLoggingData(null);
    setLogError(null);
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startDateStr = plan.weeks[0]?.startDate;
    const planStart = startDateStr ? new Date(startDateStr + 'T00:00:00') : now;
    const weeksPassed = Math.floor(
      (now.getTime() - planStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return Math.max(0, Math.min(weeksPassed, plan.weeks.length - 1));
  };

  const currentWeekIndex = getCurrentWeek();
  const displayWeek = selectedWeek !== null ? selectedWeek : currentWeekIndex;

  const getWeekProgress = (week: (typeof plan.weeks)[0]) => {
    const daysCompleted = week.trainingDays.filter(day => day.completed).length;
    const totalDays = week.trainingDays.filter(
      day => getDayMiles(day) > 0
    ).length;
    const percentage = totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0;

    const actualMiles = week.trainingDays.reduce((sum, day) => {
      return sum + (day.actualMiles ? Number(day.actualMiles) : 0);
    }, 0);

    return { daysCompleted, totalDays, percentage, actualMiles };
  };

  const getPlanStats = () => {
    const totalWeeks = plan.weeks.length;
    const completedWeeks = plan.weeks.filter(week => {
      const progress = getWeekProgress(week);
      return progress.percentage === 100;
    }).length;

    const totalMiles = plan.weeks.reduce(
      (sum, week) => sum + Number(week.targetMileage),
      0
    );
    const completedMiles = plan.weeks.reduce((sum, week) => {
      const progress = getWeekProgress(week);
      return sum + progress.actualMiles;
    }, 0);

    return { totalWeeks, completedWeeks, totalMiles, completedMiles };
  };

  const getWorkoutTypeColor = (description: string) => {
    switch (description.toLowerCase()) {
      case "long run":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "workout":
        return "bg-red-100 text-red-800 border-red-200";
      case "easy run":
        return "bg-green-100 text-green-800 border-green-200";
      case "rest":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getWorkoutDetails = (
    description: string,
    miles: number,
    weekNumber: number
  ) => {
    const details: { pace?: string; notes?: string } = {};

    switch (description.toLowerCase()) {
      case "long run":
        details.pace = "Easy pace + 30-60 seconds per mile";
        details.notes = "Focus on time on feet and fueling practice";
        break;
      case "workout":
        if (weekNumber <= 8) {
          details.pace = "Tempo runs or hill repeats";
          details.notes = "Build aerobic base and strength";
        } else {
          details.pace = "Marathon pace intervals";
          details.notes = "Practice race pace and rhythm";
        }
        break;
      case "easy run":
        details.pace = "Conversational pace";
        details.notes = "Active recovery, build aerobic base";
        break;
      case "rest":
        details.notes = "Complete rest or light cross-training";
        break;
    }

    return details;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "No goal set";
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const stats = getPlanStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-plan-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <input
                      id="edit-plan-name"
                      type="text"
                      value={editedPlan.name}
                      onChange={e =>
                        setEditedPlan(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-plan-description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="edit-plan-description"
                      value={editedPlan.description}
                      onChange={e =>
                        setEditedPlan(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label htmlFor="edit-marathon-date" className="block text-sm font-medium text-gray-700 mb-1">
                        Marathon Date
                      </label>
                      <input
                        id="edit-marathon-date"
                        type="date"
                        value={editedPlan.marathonDate.split("T")[0]}
                        onChange={e =>
                          setEditedPlan(prev => ({
                            ...prev,
                            marathonDate: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-goal-time" className="block text-sm font-medium text-gray-700 mb-1">
                        Goal Time
                      </label>
                      <input
                        id="edit-goal-time"
                        type="text"
                        value={editedPlan.goalTime}
                        onChange={e =>
                          setEditedPlan(prev => ({
                            ...prev,
                            goalTime: e.target.value,
                          }))
                        }
                        placeholder="3:30:00"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {editError && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2 max-w-md">
                      {editError}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    {plan.name}
                  </h1>
                  {plan.description && (
                    <p className="text-lg text-gray-600 mb-4">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-600">📅</span>
                      <span>
                        {new Date(plan.marathonDate + 'T00:00:00').toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-green-600">🎯</span>
                      <span>Goal: {formatTime(plan.goalTime)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-purple-600">📊</span>
                      <span>{plan.totalWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSaving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{isSaving ? "Saving..." : "Save"}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Edit Plan
                  </button>
                  <button
                    onClick={() => setShowDuplicateDialog(true)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Duplicate Plan
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Delete Plan
                  </button>
                  <button
                    onClick={onBack}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Plan Overview Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completedWeeks}/{stats.totalWeeks}
                </div>
                <div className="text-sm text-gray-500">Weeks Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats.completedMiles)}/
                  {Math.round(stats.totalMiles)}
                </div>
                <div className="text-sm text-gray-500">Miles Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Date(plan.marathonDate + 'T00:00:00Z').toLocaleDateString("en-US", { timeZone: "UTC" })}
                </div>
                <div className="text-sm text-gray-500">Marathon Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.ceil(
                    (new Date(plan.marathonDate + 'T00:00:00').getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </div>
                <div className="text-sm text-gray-500">Days to Go</div>
              </div>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("weekly")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                viewMode === "weekly"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                viewMode === "stats"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Statistics
            </button>
          </div>

          {/* Weekly View */}
          {viewMode === "weekly" && (
            <div className="space-y-6">
              {/* Week Selector */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setSelectedWeek(Math.max(0, displayWeek - 1))}
                  disabled={displayWeek === 0}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="font-medium text-gray-900 min-w-[200px] text-center">
                  Week {displayWeek + 1} of {plan.weeks.length}
                  {displayWeek === currentWeekIndex && " (Current)"}
                </span>
                <button
                  onClick={() =>
                    setSelectedWeek(
                      Math.min(plan.weeks.length - 1, displayWeek + 1)
                    )
                  }
                  disabled={displayWeek === plan.weeks.length - 1}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>

              {/* Current Week Detail */}
              {plan.weeks[displayWeek] && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {(() => {
                    const week = plan.weeks[displayWeek];
                    const progress = getWeekProgress(week);
                    return (
                      <>
                        <div className="px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                Week {week.weekNumber}
                                {week.weekNumber === 16 && " (Peak Week)"}
                                {week.weekNumber >= 17 && " (Taper)"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Starting {formatDate(week.startDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {Math.round(progress.actualMiles)}/
                                {week.targetMileage} miles
                              </div>
                              <div className="text-sm text-gray-500">
                                {progress.daysCompleted}/{progress.totalDays}{" "}
                                workouts
                              </div>
                              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="grid gap-4">
                            {week.trainingDays.map(day => {
                              const miles = getDayMiles(day);
                              const description = getDayDescription(day);
                              const isWorkout = isWorkoutDay(day);
                              const isRest = miles === 0;
                              const workoutDetails = getWorkoutDetails(
                                description,
                                miles,
                                week.weekNumber
                              );
                              const dayDate = new Date(day.date + 'T00:00:00');
                              const isPastDue =
                                dayDate < new Date() && !day.completed;

                              const isEditing = editingDayId === day.id;
                              const isLogging = loggingDayId === day.id;

                              return (
                                <div
                                  key={day.id}
                                  className={`border rounded-lg p-4 transition-all ${
                                    day.completed
                                      ? "border-green-200 bg-green-50"
                                      : isPastDue
                                        ? "border-red-200 bg-red-50"
                                        : "border-gray-200 bg-white"
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="font-medium text-gray-900">
                                          {formatDate(day.date)}
                                        </div>
                                        {!isEditing && (
                                          <>
                                            <span
                                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getWorkoutTypeColor(description)}`}
                                            >
                                              {description}
                                            </span>
                                            {isWorkout && (
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                🏃‍♂️ Workout
                                              </span>
                                            )}
                                            {isPastDue && (
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                Overdue
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </div>

                                      {isEditing ? (
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                              <label
                                                htmlFor={`miles-${day.id}`}
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                              >
                                                Miles
                                              </label>
                                              <input
                                                id={`miles-${day.id}`}
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={
                                                  editingDayData?.miles || 0
                                                }
                                                onChange={e =>
                                                  setEditingDayData(prev =>
                                                    prev
                                                      ? {
                                                          ...prev,
                                                          miles:
                                                            parseFloat(
                                                              e.target.value
                                                            ) || 0,
                                                        }
                                                      : null
                                                  )
                                                }
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            <div>
                                              <label
                                                htmlFor={`description-${day.id}`}
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                              >
                                                Description
                                              </label>
                                              <input
                                                id={`description-${day.id}`}
                                                type="text"
                                                value={
                                                  editingDayData?.description ||
                                                  ""
                                                }
                                                onChange={e =>
                                                  setEditingDayData(prev =>
                                                    prev
                                                      ? {
                                                          ...prev,
                                                          description:
                                                            e.target.value,
                                                        }
                                                      : null
                                                  )
                                                }
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., Easy Run, Tempo, Long Run"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label
                                              htmlFor={`isWorkout-${day.id}`}
                                              className="flex items-center space-x-2"
                                            >
                                              <input
                                                id={`isWorkout-${day.id}`}
                                                type="checkbox"
                                                checked={
                                                  editingDayData?.isWorkout ||
                                                  false
                                                }
                                                onChange={e =>
                                                  setEditingDayData(prev =>
                                                    prev
                                                      ? {
                                                          ...prev,
                                                          isWorkout:
                                                            e.target.checked,
                                                        }
                                                      : null
                                                  )
                                                }
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                              />
                                              <span className="text-sm font-medium text-gray-700">
                                                This is a workout day
                                              </span>
                                            </label>
                                          </div>
                                          {dayEditError && (
                                            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                                              {dayEditError}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-lg font-semibold text-gray-900 mb-1">
                                            {isRest
                                              ? "Rest Day"
                                              : `${miles} miles`}
                                          </div>

                                          {workoutDetails.pace && (
                                            <div className="text-sm text-gray-600 mb-1">
                                              <span className="font-medium">
                                                Pace:
                                              </span>{" "}
                                              {workoutDetails.pace}
                                            </div>
                                          )}

                                          {workoutDetails.notes && (
                                            <div className="text-sm text-gray-500">
                                              {workoutDetails.notes}
                                            </div>
                                          )}

                                          {day.actualMiles && (
                                            <div className="mt-2 text-sm text-green-600 bg-green-50 rounded p-2">
                                              <span className="font-medium">
                                                Actual:
                                              </span>{" "}
                                              {day.actualMiles} miles
                                            </div>
                                          )}

                                          {day.actualNotes && (
                                            <div className="mt-2 text-sm text-blue-600 bg-blue-50 rounded p-2">
                                              <span className="font-medium">
                                                Notes:
                                              </span>{" "}
                                              {day.actualNotes}
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {isLogging && (
                                        <div className="space-y-3 mt-4">
                                          <div className="text-lg font-medium text-gray-900">
                                            {isWorkout
                                              ? "Log your workout"
                                              : "Log your run"}
                                          </div>
                                          <div className="grid grid-cols-1 gap-3">
                                            <div>
                                              <label
                                                htmlFor={`actual-miles-${day.id}`}
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                              >
                                                Actual Miles
                                              </label>
                                              <input
                                                id={`actual-miles-${day.id}`}
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={
                                                  loggingData?.actualMiles || 0
                                                }
                                                onChange={e =>
                                                  setLoggingData(prev =>
                                                    prev
                                                      ? {
                                                          ...prev,
                                                          actualMiles:
                                                            parseFloat(
                                                              e.target.value
                                                            ) || 0,
                                                        }
                                                      : null
                                                  )
                                                }
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            {isWorkout && (
                                              <div>
                                                <label
                                                  htmlFor={`actual-notes-${day.id}`}
                                                  className="block text-sm font-medium text-gray-700 mb-1"
                                                >
                                                  Workout Completed
                                                </label>
                                                <div className="text-xs text-gray-500 mb-2">
                                                  Planned: {description}
                                                </div>
                                                <textarea
                                                  id={`actual-notes-${day.id}`}
                                                  value={
                                                    loggingData?.actualNotes ||
                                                    ""
                                                  }
                                                  onChange={e =>
                                                    setLoggingData(prev =>
                                                      prev
                                                        ? {
                                                            ...prev,
                                                            actualNotes:
                                                              e.target.value,
                                                          }
                                                        : null
                                                    )
                                                  }
                                                  rows={2}
                                                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                  placeholder="Edit if needed, or save as-is to log as planned"
                                                />
                                              </div>
                                            )}
                                          </div>
                                          {logError && (
                                            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                                              {logError}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-col items-end space-y-2">
                                      {isEditing ? (
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={handleCancelDayEdit}
                                            disabled={savingDayId === day.id}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleSaveDay(day.id)
                                            }
                                            disabled={savingDayId === day.id}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1"
                                          >
                                            {savingDayId === day.id && (
                                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            <span>
                                              {savingDayId === day.id
                                                ? "Saving..."
                                                : "Save"}
                                            </span>
                                          </button>
                                        </div>
                                      ) : isLogging ? (
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={handleCancelLog}
                                            disabled={savingLogId === day.id}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleSaveLog(day.id)
                                            }
                                            disabled={savingLogId === day.id}
                                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1"
                                          >
                                            {savingLogId === day.id && (
                                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            <span>
                                              {savingLogId === day.id
                                                ? "Saving..."
                                                : isWorkout
                                                  ? "Save Workout"
                                                  : "Save Run"}
                                            </span>
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleEditDay(day)}
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium py-1 px-3 rounded-md transition-colors"
                                          >
                                            Edit Day
                                          </button>
                                          {!isRest && !day.completed && (
                                            <button
                                              onClick={() =>
                                                handleStartLogging(day)
                                              }
                                              className="bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium py-1 px-3 rounded-md transition-colors"
                                            >
                                              {isWorkout
                                                ? "Log Workout"
                                                : "Log Run"}
                                            </button>
                                          )}
                                          {day.completed && (
                                            <>
                                              <button
                                                onClick={() =>
                                                  handleStartLogging(day)
                                                }
                                                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm font-medium py-1 px-3 rounded-md transition-colors"
                                              >
                                                {isWorkout
                                                  ? "Edit Workout"
                                                  : "Edit Run"}
                                              </button>
                                              <div className="text-xs text-gray-500">
                                                ✓{" "}
                                                {day.completedAt
                                                  ? new Date(
                                                      day.completedAt
                                                    ).toLocaleDateString()
                                                  : "Completed"}
                                              </div>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Statistics View */}
          {viewMode === "stats" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Training Progress
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Weekly Progress
                  </h4>
                  <div className="space-y-2">
                    {plan.weeks.map((week, index) => {
                      const progress = getWeekProgress(week);
                      const isCurrentWeek = index === currentWeekIndex;

                      return (
                        <div
                          key={week.id}
                          className={`flex items-center justify-between p-3 rounded-md ${
                            isCurrentWeek
                              ? "bg-blue-50 border border-blue-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="font-medium text-sm">
                              Week {week.weekNumber}
                              {week.weekNumber === 16 && " (Peak)"}
                              {week.weekNumber >= 17 && " (Taper)"}
                            </div>
                            {isCurrentWeek && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                              {Math.round(progress.actualMiles)}/
                              {week.targetMileage} miles
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 w-12">
                              {Math.round(progress.percentage)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Training Plan
              </h3>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. This will permanently delete the
                training plan and all associated data.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type &ldquo;{plan.name}&rdquo; to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={e => setDeleteConfirmation(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={plan.name}
                />
              </div>
              {deleteError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2 mb-4">
                  {deleteError}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmation("");
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmation !== plan.name}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isDeleting ? "Deleting..." : "Delete Plan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Dialog */}
        {showDuplicateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Duplicate Training Plan
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="duplicate-plan-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Plan Name
                  </label>
                  <input
                    id="duplicate-plan-name"
                    type="text"
                    value={duplicateForm.name}
                    onChange={e =>
                      setDuplicateForm(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="duplicate-plan-description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="duplicate-plan-description"
                    value={duplicateForm.description}
                    onChange={e =>
                      setDuplicateForm(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="duplicate-marathon-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Marathon Date
                  </label>
                  <input
                    id="duplicate-marathon-date"
                    type="date"
                    value={duplicateForm.marathonDate}
                    onChange={e =>
                      setDuplicateForm(prev => ({
                        ...prev,
                        marathonDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="duplicate-goal-time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Goal Time
                  </label>
                  <input
                    id="duplicate-goal-time"
                    type="text"
                    value={duplicateForm.goalTime}
                    onChange={e =>
                      setDuplicateForm(prev => ({
                        ...prev,
                        goalTime: e.target.value,
                      }))
                    }
                    placeholder="3:30:00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {duplicateError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2 mt-4">
                  {duplicateError}
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeDuplicateDialog}
                  disabled={isDuplicating}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={
                    isDuplicating ||
                    !duplicateForm.name.trim() ||
                    !duplicateForm.marathonDate
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDuplicating && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isDuplicating ? "Duplicating..." : "Duplicate Plan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
