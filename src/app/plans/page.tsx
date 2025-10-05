"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  marathonDate: string;
  goalTime: string | null;
  totalWeeks: number;
  createdAt: Date;
  updatedAt: Date;
}

function PlansPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/plans");

        if (!response.ok) {
          throw new Error("Failed to fetch plans");
        }

        const data = await response.json();
        setPlans(data.plans || []);
      } catch (error) {
        console.error("Network error fetching plans:", error);
        setError("Failed to load training plans");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlans();
    }
  }, [user]);

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${planName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingPlanId(planId);

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete plan");
      }

      // Remove the plan from the local state
      setPlans(plans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Failed to delete plan. Please try again.");
    } finally {
      setDeletingPlanId(null);
    }
  };

  // At this point, user is guaranteed to exist due to ProtectedRoute
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Training Plans
            </h1>
            <p className="text-gray-600">
              View and manage all your marathon training plans.
            </p>
          </div>
          <Link
            href="/plans/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Create New Plan
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your training plans...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load plans
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Plans Grid */}
      {!loading && !error && plans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Plan Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-gray-600 text-sm mb-3">
                    {plan.description}
                  </p>
                )}
              </div>

              {/* Plan Details */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>
                    Marathon: {new Date(plan.marathonDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">⏰</span>
                  <span>{plan.totalWeeks} weeks</span>
                </div>
                {plan.goalTime && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🎯</span>
                    <span>Goal: {plan.goalTime}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">📝</span>
                  <span>
                    Created {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Plan Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/plans/${plan.id}`}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    View Plan
                  </Link>
                  <button
                    onClick={() => alert("Edit functionality coming soon!")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <button
                  onClick={() => handleDeletePlan(plan.id, plan.name)}
                  disabled={deletingPlanId === plan.id}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {deletingPlanId === plan.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && plans.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-6">📋</div>
          <h3 className="text-2xl font-medium text-gray-900 mb-3">
            No training plans yet
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Get started by creating your first marathon training plan. Our
            system will generate a personalized 18-week plan tailored to your
            goals.
          </p>
          <Link
            href="/plans/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Create Your First Plan
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <PlansPageContent />
      </ProtectedRoute>
    </MainLayout>
  );
}
