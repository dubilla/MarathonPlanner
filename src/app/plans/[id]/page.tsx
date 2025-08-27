"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getFullTrainingPlan } from '@/lib/db/queries';
import { PlanWithRelations } from '@/services/PlanCreationService';

function PlanViewContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        const fetchedPlan = await getFullTrainingPlan(id);
        if (!fetchedPlan) {
          setError('Training plan not found');
          return;
        }
        
        // Check if user owns this plan
        if (fetchedPlan.userId !== user?.id) {
          setError('You do not have permission to view this plan');
          return;
        }
        
        setPlan(fetchedPlan);
      } catch (err) {
        console.error('Failed to load plan:', err);
        setError('Failed to load training plan');
      } finally {
        setLoading(false);
      }
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
            onClick={() => router.push('/dashboard')}
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h1>
            <p className="text-gray-600">{plan.description}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{plan.totalWeeks}</div>
            <div className="text-sm text-gray-500">Weeks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Date(plan.marathonDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">Marathon Date</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {plan.goalTime || 'No goal set'}
            </div>
            <div className="text-sm text-gray-500">Goal Time</div>
          </div>
        </div>

        <div className="space-y-4">
          {plan.weeks.map((week) => (
            <div key={week.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Week {week.weekNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Starting {new Date(week.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium text-blue-600">
                    {week.targetMileage} miles
                  </div>
                  <div className="text-sm text-gray-500">Target</div>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {week.trainingDays.map((day) => (
                  <div
                    key={day.id}
                    className="text-center p-2 bg-gray-50 rounded border"
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day.dayOfWeek - 1]}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {day.miles === '0.00' ? 'Rest' : `${parseFloat(day.miles)}mi`}
                    </div>
                    <div className="text-xs text-gray-500">{day.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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