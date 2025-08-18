"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NewPlanForm from '@/components/plans/NewPlanForm';
import PlanPreview from '@/components/plans/PlanPreview';
import { PlanCreationService, CreateMarathonPlanInput, PlanWithRelations } from '@/services/PlanCreationService';
import { savePlan } from '@/lib/db/queries';

type PageState = 'form' | 'preview' | 'success';

function PlansNewPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('form');
  const [generatedPlan, setGeneratedPlan] = useState<PlanWithRelations | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const planService = new PlanCreationService();

  const handleFormSubmit = async (input: CreateMarathonPlanInput) => {
    try {
      const plan = await planService.createMarathonPlan(input);
      setGeneratedPlan(plan);
      setPageState('preview');
    } catch (error) {
      throw error; // Let the form handle the error display
    }
  };

  const handleTryAgain = () => {
    setPageState('form');
    setGeneratedPlan(null);
  };

  const handleCreatePlan = async () => {
    if (!generatedPlan || !user) return;

    setIsCreating(true);
    try {
      await savePlan(generatedPlan);
      setPageState('success');
    } catch (error) {
      console.error('Failed to save plan:', error);
      // Handle save error - could show an error message
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {pageState === 'form' && (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Training Plan
            </h1>
            <p className="text-gray-600">
              Generate a personalized 18-week marathon training plan tailored to your goals.
            </p>
          </div>
          <div className="flex justify-center">
            <NewPlanForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      )}

      {pageState === 'preview' && generatedPlan && (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Review Your Training Plan
            </h1>
            <p className="text-gray-600">
              Review the generated plan below. You can create it or try again with different parameters.
            </p>
          </div>
          <PlanPreview 
            plan={generatedPlan}
            onCreate={handleCreatePlan}
            onTryAgain={handleTryAgain}
            isCreating={isCreating}
          />
        </div>
      )}

      {pageState === 'success' && (
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Plan created successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Your marathon training plan has been saved to your account.
          </p>
          <button
            onClick={handleBackToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
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