"use client";

import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";

function DashboardContent() {
  const { user } = useAuth();

  // At this point, user is guaranteed to exist due to ProtectedRoute
  if (!user) return null;

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

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <nav className="space-y-2">
                <Link
                  href="/training-plans"
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
                  href="/workouts"
                  className="block p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  🏃‍♂️ Log Workout
                </Link>
                <Link
                  href="/analytics"
                  className="block p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  📊 View Analytics
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
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-sm text-gray-600 mt-1">Training plans in progress</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
                <div className="text-2xl font-bold text-gray-900">0 mi</div>
                <p className="text-sm text-gray-600 mt-1">Miles completed</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Streak</h3>
                <div className="text-2xl font-bold text-gray-900">0 days</div>
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
              
              {/* Empty State */}
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No training plans yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first marathon training plan.
                </p>
                <Link
                  href="/plans/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Create Your First Plan
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              
              {/* Empty State */}
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📈</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600">
                  Your recent workouts and plan updates will appear here.
                </p>
              </div>
            </div>

            {/* Upcoming Workouts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Workouts</h2>
              
              {/* Empty State */}
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🗓️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming workouts</h3>
                <p className="text-gray-600">
                  Create a training plan to see your scheduled workouts.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </MainLayout>
  );
}