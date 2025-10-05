"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PlanWithRelations } from "@/services/PlanCreationService";
import TrainingPlanView from "@/components/plans/TrainingPlanView";

function PlanViewContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      if (!id || typeof id !== "string") return;

      let response;
      try {
        response = await fetch(`/api/plans/${id}`);
      } catch (err) {
        console.error("Network error loading plan:", err);
        setError("Failed to load training plan");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          setError("Training plan not found");
        } else if (response.status === 403) {
          setError("You do not have permission to view this plan");
        } else if (response.status === 401) {
          setError("You must be logged in to view this plan");
        } else {
          setError("Failed to load training plan");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPlan(data.plan);
      setLoading(false);
    };

    if (user) {
      loadPlan();
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-sm border border-red-200 p-8">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TrainingPlanView plan={plan} onBack={() => router.push("/dashboard")} />
    </div>
  );
}

export default function PlanViewPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <PlanViewContent />
      </ProtectedRoute>
    </MainLayout>
  );
}
