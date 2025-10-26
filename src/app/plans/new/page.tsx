"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NewPlanForm from "@/components/plans/NewPlanForm";
import PlanPreview from "@/components/plans/PlanPreview";
import {
  PlanCreator,
  CreateMarathonPlanInput,
  PlanWithRelations,
} from "@/services/PlanCreator";

type PageState = "form" | "preview";

function PlansNewPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("form");
  const [generatedPlan, setGeneratedPlan] = useState<PlanWithRelations | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const planService = new PlanCreator();

  const handleFormSubmit = async (input: CreateMarathonPlanInput) => {
    const plan = await planService.createMarathonPlan(input);
    if (!plan) {
      throw new Error("Failed to create plan");
    }
    setGeneratedPlan(plan);
    setPageState("preview");
  };

  const handleTryAgain = () => {
    setPageState("form");
    setGeneratedPlan(null);
    setCreateError(null);
  };

  const handleCreatePlan = async () => {
    if (!generatedPlan || !user) return;

    setIsCreating(true);
    setCreateError(null);

    let response;
    try {
      response = await fetch("/api/plans/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatedPlan),
      });
    } catch (error) {
      console.error("Network error saving plan:", error);
      setCreateError("Failed to save training plan. Please try again.");
      setIsCreating(false);
      return;
    }

    if (!response.ok) {
      setCreateError("Failed to save training plan. Please try again.");
      setIsCreating(false);
      return;
    }

    const data = await response.json();
    if (data.success) {
      router.push(`/plans/${generatedPlan.id}`);
    } else {
      setCreateError(
        data.error || "Failed to save training plan. Please try again."
      );
    }

    setIsCreating(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {pageState === "form" && (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Training Plan
            </h1>
            <p className="text-gray-600">
              Generate a personalized 18-week marathon training plan tailored to
              your goals.
            </p>
          </div>
          <div className="flex justify-center">
            <NewPlanForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      )}

      {pageState === "preview" && generatedPlan && (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Review Your Training Plan
            </h1>
            <p className="text-gray-600">
              Review the generated plan below. You can create it or try again
              with different parameters.
            </p>
          </div>
          <PlanPreview
            plan={generatedPlan}
            onCreate={handleCreatePlan}
            onTryAgain={handleTryAgain}
            isCreating={isCreating}
            createError={createError}
          />
        </div>
      )}
    </div>
  );
}

export default function PlansNewPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <PlansNewPageContent />
      </ProtectedRoute>
    </MainLayout>
  );
}
