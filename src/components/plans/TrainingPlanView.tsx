"use client";

import { useState } from 'react';
import { PlanWithRelations } from '@/services/PlanCreationService';

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

type ViewMode = 'weekly' | 'calendar' | 'stats';

export default function TrainingPlanView({ plan, onBack }: TrainingPlanViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [workoutProgress, setWorkoutProgress] = useState<Record<string, WorkoutProgress>>({});
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const getCurrentWeek = () => {
    const now = new Date();
    const planStart = new Date(plan.weeks[0]?.startDate || now);
    const weeksPassed = Math.floor((now.getTime() - planStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(weeksPassed, plan.weeks.length - 1));
  };

  const currentWeekIndex = getCurrentWeek();
  const displayWeek = selectedWeek !== null ? selectedWeek : currentWeekIndex;

  const getWeekProgress = (week: typeof plan.weeks[0]) => {
    const daysCompleted = week.trainingDays.filter(day => 
      workoutProgress[day.id]?.completed
    ).length;
    const totalDays = week.trainingDays.filter(day => Number(day.miles) > 0).length;
    const percentage = totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0;
    
    const actualMiles = week.trainingDays.reduce((sum, day) => {
      const progress = workoutProgress[day.id];
      return sum + (progress?.actualMiles || 0);
    }, 0);
    
    return { daysCompleted, totalDays, percentage, actualMiles };
  };

  const getPlanStats = () => {
    const totalWeeks = plan.weeks.length;
    const completedWeeks = plan.weeks.filter(week => {
      const progress = getWeekProgress(week);
      return progress.percentage === 100;
    }).length;
    
    const totalMiles = plan.weeks.reduce((sum, week) => sum + Number(week.targetMileage), 0);
    const completedMiles = plan.weeks.reduce((sum, week) => {
      const progress = getWeekProgress(week);
      return sum + progress.actualMiles;
    }, 0);
    
    return { totalWeeks, completedWeeks, totalMiles, completedMiles };
  };

  const toggleWorkoutCompletion = (dayId: string, completed: boolean, actualMiles?: number) => {
    setWorkoutProgress(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        dayId,
        completed,
        actualMiles,
        completedAt: completed ? new Date() : undefined
      }
    }));
  };

  const getWorkoutTypeColor = (description: string) => {
    switch (description.toLowerCase()) {
      case 'long run': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'workout': return 'bg-red-100 text-red-800 border-red-200';
      case 'easy run': return 'bg-green-100 text-green-800 border-green-200';
      case 'rest': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getWorkoutDetails = (description: string, miles: number, weekNumber: number) => {
    const details: { pace?: string; notes?: string } = {};
    
    switch (description.toLowerCase()) {
      case 'long run':
        details.pace = 'Easy pace + 30-60 seconds per mile';
        details.notes = 'Focus on time on feet and fueling practice';
        break;
      case 'workout':
        if (weekNumber <= 8) {
          details.pace = 'Tempo runs or hill repeats';
          details.notes = 'Build aerobic base and strength';
        } else {
          details.pace = 'Marathon pace intervals';
          details.notes = 'Practice race pace and rhythm';
        }
        break;
      case 'easy run':
        details.pace = 'Conversational pace';
        details.notes = 'Active recovery, build aerobic base';
        break;
      case 'rest':
        details.notes = 'Complete rest or light cross-training';
        break;
    }
    
    return details;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const stats = getPlanStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h1>
          <p className="text-gray-600">{plan.description}</p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
        >
          Back to Dashboard
        </button>
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
              {Math.round(stats.completedMiles)}/{Math.round(stats.totalMiles)}
            </div>
            <div className="text-sm text-gray-500">Miles Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Date(plan.marathonDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">Marathon Date</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.ceil((new Date(plan.marathonDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
            <div className="text-sm text-gray-500">Days to Go</div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'weekly'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Weekly View
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'stats'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Weekly View */}
      {viewMode === 'weekly' && (
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
              {displayWeek === currentWeekIndex && ' (Current)'}
            </span>
            <button
              onClick={() => setSelectedWeek(Math.min(plan.weeks.length - 1, displayWeek + 1))}
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
                            {week.weekNumber === 16 && ' (Peak Week)'}
                            {week.weekNumber >= 17 && ' (Taper)'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Starting {formatDate(week.startDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(progress.actualMiles)}/{week.targetMileage} miles
                          </div>
                          <div className="text-sm text-gray-500">
                            {progress.daysCompleted}/{progress.totalDays} workouts
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
                          const isRest = Number(day.miles) === 0;
                          const dayProgress = workoutProgress[day.id];
                          const workoutDetails = getWorkoutDetails(day.description, Number(day.miles), week.weekNumber);
                          const dayDate = new Date(day.date);
                          const isPastDue = dayDate < new Date() && !dayProgress?.completed;
                          
                          return (
                            <div
                              key={day.id}
                              className={`border rounded-lg p-4 transition-all ${
                                dayProgress?.completed
                                  ? 'border-green-200 bg-green-50'
                                  : isPastDue
                                  ? 'border-red-200 bg-red-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="font-medium text-gray-900">
                                      {formatDate(day.date)}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getWorkoutTypeColor(day.description)}`}>
                                      {day.description}
                                    </span>
                                    {isPastDue && (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                        Overdue
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="text-lg font-semibold text-gray-900 mb-1">
                                    {isRest ? 'Rest Day' : `${Number(day.miles)} miles`}
                                  </div>
                                  
                                  {workoutDetails.pace && (
                                    <div className="text-sm text-gray-600 mb-1">
                                      <span className="font-medium">Pace:</span> {workoutDetails.pace}
                                    </div>
                                  )}
                                  
                                  {workoutDetails.notes && (
                                    <div className="text-sm text-gray-500">
                                      {workoutDetails.notes}
                                    </div>
                                  )}
                                  
                                  {dayProgress?.notes && (
                                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 rounded p-2">
                                      <span className="font-medium">Notes:</span> {dayProgress.notes}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end space-y-2">
                                  {!isRest && (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={dayProgress?.completed || false}
                                        onChange={(e) => toggleWorkoutCompletion(
                                          day.id, 
                                          e.target.checked,
                                          e.target.checked ? Number(day.miles) : 0
                                        )}
                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                      />
                                      <label className="text-sm text-gray-700">
                                        {dayProgress?.completed ? 'Completed' : 'Mark complete'}
                                      </label>
                                    </div>
                                  )}
                                  
                                  {dayProgress?.completed && (
                                    <div className="text-xs text-gray-500">
                                      ✓ {dayProgress.completedAt?.toLocaleDateString()}
                                    </div>
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
      {viewMode === 'stats' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Training Progress</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Weekly Progress</h4>
              <div className="space-y-2">
                {plan.weeks.map((week, index) => {
                  const progress = getWeekProgress(week);
                  const isCurrentWeek = index === currentWeekIndex;
                  
                  return (
                    <div key={week.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium ${isCurrentWeek ? 'text-blue-600' : 'text-gray-900'}`}>
                          Week {week.weekNumber}
                          {isCurrentWeek && ' (Current)'}
                        </span>
                        {week.weekNumber === 16 && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            Peak
                          </span>
                        )}
                        {week.weekNumber >= 17 && (
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            Taper
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          {Math.round(progress.actualMiles)}/{week.targetMileage} mi
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${progress.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {Math.round(progress.percentage)}%
                          </span>
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
  );
}