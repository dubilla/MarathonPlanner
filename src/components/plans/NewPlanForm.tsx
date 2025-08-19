"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CreateMarathonPlanInput } from '@/services/PlanCreationService';

interface NewPlanFormProps {
  onSubmit?: (input: CreateMarathonPlanInput) => Promise<void>;
}

export default function NewPlanForm({ onSubmit }: NewPlanFormProps) {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    marathonDate: '',
    longestWeeklyMileage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You must be logged in to create a training plan.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.marathonDate || !formData.longestWeeklyMileage) {
      return;
    }

    const marathonDate = new Date(formData.marathonDate);

    if (!onSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        marathonDate,
        longestWeeklyMileage: parseInt(formData.longestWeeklyMileage),
        userId: user.id
      });
    } catch {
      setError('Failed to create plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Marathon Training Plan
        </h1>
        <p className="text-gray-600 text-sm">
          This will create an 18-week training plan ending on your marathon date.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="marathonDate" className="block text-sm font-medium text-gray-700 mb-1">
            Marathon Date
          </label>
          <input
            type="date"
            id="marathonDate"
            name="marathonDate"
            value={formData.marathonDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="longestWeeklyMileage" className="block text-sm font-medium text-gray-700 mb-1">
            Peak Weekly Mileage (miles)
          </label>
          <input
            type="number"
            id="longestWeeklyMileage"
            name="longestWeeklyMileage"
            value={formData.longestWeeklyMileage}
            onChange={handleChange}
            min="20"
            max="100"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 50"
          />
          <p className="mt-1 text-xs text-gray-500">
            This will be your highest mileage week (Week 16) before tapering.
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Creating your training plan...' : 'Create Plan'}
        </button>
      </form>
    </div>
  );
}