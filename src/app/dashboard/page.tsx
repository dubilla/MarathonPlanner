"use client";

import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { useState, useEffect } from "react";

interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  marathonDate: string;
  goalTime: string | null;
  totalWeeks: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardStats {
  activePlans: number;
  weeklyMiles: number;
  currentStreak: number;
}

interface UpcomingWorkout {
  id: string;
  date: string;
  dayOfWeek: number;
  miles: string;
  description: string;
  planName: string;
  planId: string;
  weekNumber: number;
}

function DashboardContent() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ activePlans: 0, weeklyMiles: 0, currentStreak: 0 });
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<UpcomingWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [plansResponse, statsResponse, workoutsResponse] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/upcoming')
        ]);

        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setPlans(plansData.plans || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json();
          setUpcomingWorkouts(workoutsData.workouts || []);
        }

        // If any critical requests failed, show error
        if (!plansResponse.ok || !statsResponse.ok || !workoutsResponse.ok) {
          setError("Some dashboard data could not be loaded");
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // At this point, user is guaranteed to exist due to ProtectedRoute
  if (!user) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name || user.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600">
          Track your marathon training progress and stay on course to achieve your goals.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-800">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <nav className="space-y-2">
              <Link
                href="/plans"
                className="block p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                📅 View Training Plans
              </Link>
              <Link
                href="/plans/new"
                className="block p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                ➕ Create New Plan
              </Link>
              <Link
                href="#"
                className="block p-3 rounded-lg text-gray-400 cursor-not-allowed"
              >
                🏃‍♂️ Log Workout (Coming Soon)
              </Link>
              <Link
                href="#"
                className="block p-3 rounded-lg text-gray-400 cursor-not-allowed"
              >
                📊 View Analytics (Coming Soon)
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Plans</h3>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.activePlans}
              </div>
              <p className="text-sm text-gray-600 mt-1">Training plans in progress</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : `${stats.weeklyMiles} mi`}
              </div>
              <p className="text-sm text-gray-600 mt-1">Miles completed</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Streak</h3>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : `${stats.currentStreak} days`}
              </div>
              <p className="text-sm text-gray-600 mt-1">Current training streak</p>
            </div>
          </div>

          {/* My Training Plans */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Training Plans</h2>
              <Link
                href="/plans/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Plan
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">Loading your training plans...</div>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No training plans yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first marathon training plan to get started on your journey.
                </p>
                <Link
                  href="/plans/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Your First Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Marathon: {formatDate(plan.marathonDate)}</span>
                          <span>{plan.totalWeeks} weeks</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/plans/${plan.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Plan
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {plans.length > 3 && (
                  <div className="text-center pt-4">
                    <Link
                      href="/plans"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all {plans.length} plans →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Workouts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Workouts</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg">Loading upcoming workouts...</div>
              </div>
            ) : upcomingWorkouts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🏃‍♂️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming workouts</h3>
                <p className="text-gray-600">
                  Create a training plan to see your upcoming workouts here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingWorkouts.slice(0, 5).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-500 min-w-[80px]">
                        {formatDate(workout.date)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {workout.description} - {parseFloat(workout.miles) === 0 ? 'Rest' : `${parseFloat(workout.miles)} miles`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {workout.planName} • Week {workout.weekNumber}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/plans/${workout.planId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardContent />
      </MainLayout>
    </ProtectedRoute>
  );
}