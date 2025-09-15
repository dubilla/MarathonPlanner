"use client";

import { useState } from "react";
import { PlanWithRelations } from "@/services/PlanCreationService";
import { TrainingDay } from "@/types";

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

export default function TrainingPlanView({
  plan,
  onBack,
}: TrainingPlanViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
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

      window.location.reload();
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
      window.location.href = `/plans/${newPlan.id}`;
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

  const handleEditDay = (day: any) => {
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

      // Reload the page to reflect changes
      window.location.reload();
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

  const getCurrentWeek = () => {
    const now = new Date();
    const planStart = new Date(plan.weeks[0]?.startDate || now);
    const weeksPassed = Math.floor(
      (now.getTime() - planStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return Math.max(0, Math.min(weeksPassed, plan.weeks.length - 1));
  };

  const toggleWorkoutCompletion = (
    dayId: string,
    completed: boolean,
    actualMiles?: number
  ) => {
    setWorkoutProgress(prev => ({
      ...prev,
      [dayId]: {
        dayId,
        completed,
        actualMiles,
        completedAt: completed ? new Date() : undefined,
      },
    }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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

  const getWorkoutTypeColor = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes("easy") || desc.includes("recovery")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (desc.includes("tempo") || desc.includes("threshold")) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    if (desc.includes("interval") || desc.includes("speed")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (desc.includes("long")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getWorkoutDetails = (
    description: string,
    miles: number,
    weekNumber: number
  ) => {
    const isLongRun = description.toLowerCase().includes("long");
    const isTempo = description.toLowerCase().includes("tempo");
    const isInterval = description.toLowerCase().includes("interval");
    const isEasy = description.toLowerCase().includes("easy");

    let pace = "";
    let notes = "";

    if (isEasy) {
      pace = "Easy pace (7:30-8:30/mile)";
      notes = "Conversational pace, should feel comfortable";
    } else if (isLongRun) {
      pace = "Long run pace (7:45-8:15/mile)";
      notes = "Build endurance, practice race day nutrition";
    } else if (isTempo) {
      pace = "Tempo pace (6:45-7:15/mile)";
      notes = "Comfortably hard, sustainable for 20-40 minutes";
    } else if (isInterval) {
      pace = "5K-10K pace (6:15-6:45/mile)";
      notes = "High intensity with recovery intervals";
    }

    return { pace, notes };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <button
              onClick={onBack}
              className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to Plans
            </button>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={editedPlan.name}
                    onChange={e =>
                      setEditedPlan(prev => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marathon Date
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal Time
                    </label>
                    <input
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
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h1>
                {plan.description && (
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>
                      Marathon:{" "}
                      {new Date(plan.marathonDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🎯</span>
                    <span>Goal: {formatTime(plan.goalTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>{plan.totalWeeks} weeks</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Edit Plan
                </button>
                <button
                  onClick={() => setShowDuplicateDialog(true)}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Duplicate Plan
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Delete Plan
                </button>
              </>
            )}
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["weekly", "calendar", "stats"] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                viewMode === mode
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "weekly" && (
        <div className="space-y-8">
          {plan.weeks.map((week, weekIndex) => (
            <div
              key={week.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              {/* Week Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Week {week.weekNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(week.startDate).toLocaleDateString()} -{" "}
                    {new Date(
                      new Date(week.startDate).getTime() + 6 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Target: {week.targetMileage} miles
                  </p>
                </div>
                {weekIndex === getCurrentWeek() && (
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    Current Week
                  </span>
                )}
              </div>

              {/* Training Days */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {week.trainingDays?.map(day => {
                  const miles = getDayMiles(day);
                  const description = getDayDescription(day);
                  const isWorkout = isWorkoutDay(day);
                  const isRest = miles === 0;
                  const dayProgress = workoutProgress[day.id];
                  const workoutDetails = getWorkoutDetails(
                    description,
                    miles,
                    week.weekNumber
                  );
                  const dayDate = new Date(day.date);
                  const isPastDue =
                    dayDate < new Date() && !dayProgress?.completed;

                  const isEditing = editingDayId === day.id;

                  return (
                    <div
                      key={day.id}
                      className={`border rounded-lg p-4 transition-all ${
                        dayProgress?.completed
                          ? "border-green-200 bg-green-50"
                          : isPastDue
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 bg-white hover:shadow-md"
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
                                    value={editingDayData?.miles || 0}
                                    onChange={e =>
                                      setEditingDayData(prev =>
                                        prev
                                          ? {
                                              ...prev,
                                              miles:
                                                parseFloat(e.target.value) || 0,
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
                                    value={editingDayData?.description || ""}
                                    onChange={e =>
                                      setEditingDayData(prev =>
                                        prev
                                          ? {
                                              ...prev,
                                              description: e.target.value,
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
                                    checked={editingDayData?.isWorkout || false}
                                    onChange={e =>
                                      setEditingDayData(prev =>
                                        prev
                                          ? {
                                              ...prev,
                                              isWorkout: e.target.checked,
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
                                {isRest ? "Rest Day" : `${miles} miles`}
                              </div>

                              {workoutDetails.pace && (
                                <div className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Pace:</span>{" "}
                                  {workoutDetails.pace}
                                </div>
                              )}

                              {workoutDetails.notes && (
                                <div className="text-sm text-gray-500">
                                  {workoutDetails.notes}
                                </div>
                              )}

                              {dayProgress?.notes && (
                                <div className="mt-2 text-sm text-blue-600 bg-blue-50 rounded p-2">
                                  <span className="font-medium">Notes:</span>{" "}
                                  {dayProgress.notes}
                                </div>
                              )}
                            </>
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
                                onClick={() => handleSaveDay(day.id)}
                                disabled={savingDayId === day.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1"
                              >
                                {savingDayId === day.id && (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                <span>
                                  {savingDayId === day.id ? "Saving..." : "Save"}
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
                              {!isRest && (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={dayProgress?.completed || false}
                                    onChange={e =>
                                      toggleWorkoutCompletion(
                                        day.id,
                                        e.target.checked,
                                        e.target.checked ? miles : 0
                                      )
                                    }
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <label className="text-sm text-gray-700">
                                    {dayProgress?.completed
                                      ? "Completed"
                                      : "Mark complete"}
                                  </label>
                                </div>
                              )}

                              {dayProgress?.completed && (
                                <div className="text-xs text-gray-500">
                                  ✓{" "}
                                  {dayProgress.completedAt?.toLocaleDateString()}
                                </div>
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
          ))}
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Calendar View (Coming Soon)
          </h3>
          <p className="text-gray-600">
            This view will show your training plan in a calendar format with
            daily workouts and progress tracking.
          </p>
        </div>
      )}

      {viewMode === "stats" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Statistics (Coming Soon)
          </h3>
          <p className="text-gray-600">
            This view will show your training statistics, progress charts, and
            performance analytics.
          </p>
        </div>
      )}

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
                Type "{plan.name}" to confirm:
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
                <label htmlFor="duplicate-plan-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  id="duplicate-plan-name"
                  type="text"
                  value={duplicateForm.name}
                  onChange={e =>
                    setDuplicateForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="duplicate-plan-description" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="duplicate-marathon-date" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="duplicate-goal-time" className="block text-sm font-medium text-gray-700 mb-1">
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
  );
}