import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/hooks/useAuth';
import { PlanCreationService } from '@/services/PlanCreationService';
import PlansNewPage from '@/app/plans/new/page';

jest.mock('@/hooks/useAuth');
jest.mock('@/services/PlanCreationService');

// Mock fetch globally
global.fetch = jest.fn();

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPlanCreationService = PlanCreationService as jest.MockedClass<typeof PlanCreationService>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: null,
  image: null,
  password: null
};

const mockPlan = {
  id: 'plan-123',
  userId: 'user-123',
  name: 'Marathon Training Plan',
  description: '18-week marathon training plan ending on Mon Oct 15 2024',
  marathonDate: '2024-10-15',
  goalTime: null,
  totalWeeks: 18,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  weeks: [
    {
      id: 'week-1',
      planId: 'plan-123',
      weekNumber: 1,
      startDate: '2024-06-10',
      targetMileage: '25.00',
      actualMileage: null,
      notes: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      trainingDays: [
        { id: 'day-1', weekId: 'week-1', dayOfWeek: 1, miles: '4.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-2', weekId: 'week-1', dayOfWeek: 2, miles: '4.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-3', weekId: 'week-1', dayOfWeek: 3, miles: '4.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-4', weekId: 'week-1', dayOfWeek: 4, miles: '4.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-5', weekId: 'week-1', dayOfWeek: 5, miles: '4.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-6', weekId: 'week-1', dayOfWeek: 6, miles: '5.00', description: 'Long Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-7', weekId: 'week-1', dayOfWeek: 7, miles: '0.00', description: 'Rest', createdAt: new Date(), updatedAt: new Date() },
      ]
    }
  ]
};

describe('PlansNewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null
    });
    mockFetch.mockReset();
  });

  describe('Page Structure', () => {
    it('renders page with correct layout', () => {
      render(<PlansNewPage />);
      
      expect(screen.getByText('Create New Training Plan')).toBeInTheDocument();
      expect(screen.getByLabelText('Marathon Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Peak Weekly Mileage (miles)')).toBeInTheDocument();
    });

    it('uses protected route', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null
      });
      
      render(<PlansNewPage />);
      
      expect(screen.getByTestId('redirecting')).toBeInTheDocument();
    });
  });

  describe('Form Workflow', () => {
    it('shows form initially', () => {
      render(<PlansNewPage />);
      
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeInTheDocument();
      expect(screen.queryByText('Training Plan Preview')).not.toBeInTheDocument();
    });

    it('generates and shows plan preview after form submission', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = jest.fn().mockResolvedValue(mockPlan);
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
      
      render(<PlansNewPage />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date far enough in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Training Plan Preview')).toBeInTheDocument();
      });
      
      expect(mockCreatePlan).toHaveBeenCalledWith({
        marathonDate: new Date(futureDateString),
        longestWeeklyMileage: 50,
        userId: 'user-123'
      });
    });

    it('shows loading state while generating plan', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
      
      render(<PlansNewPage />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      expect(screen.getByText('Creating your training plan...')).toBeInTheDocument();
    });

    it('handles plan generation errors', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = jest.fn().mockRejectedValue(new Error('Generation failed'));
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
      
      render(<PlansNewPage />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create plan. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Plan Preview Actions', () => {
    beforeEach(async () => {
      const mockCreatePlan = jest.fn().mockResolvedValue(mockPlan);
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
    });

    it('returns to form when Try Again is clicked', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = jest.fn().mockResolvedValue(mockPlan);
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
      
      render(<PlansNewPage />);
      
      // Fill and submit form
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Training Plan Preview')).toBeInTheDocument();
      });
      
      // Click Try Again
      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      await user.click(tryAgainButton);
      
      // Should return to form
      expect(screen.getByLabelText('Marathon Date')).toBeInTheDocument();
      expect(screen.queryByText('Training Plan Preview')).not.toBeInTheDocument();
    });

    it('saves plan when Create is clicked', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = jest.fn().mockResolvedValue(mockPlan);
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      } as Response);
      
      render(<PlansNewPage />);
      
      // Fill and submit form
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Training Plan Preview')).toBeInTheDocument();
      });
      
      // Click Create
      const createButton = screen.getByRole('button', { name: 'Create Plan' });
      await user.click(createButton);
      
      // Should redirect to plan view
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/plans/plan-123');
      });
    });

    it('shows loading state while saving plan', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = jest.fn().mockResolvedValue(mockPlan);
      mockPlanCreationService.prototype.createMarathonPlan = mockCreatePlan;
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PlansNewPage />);
      
      // Fill and submit form to get to preview
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Training Plan Preview')).toBeInTheDocument();
      });
      
      // Click Create
      const createButton = screen.getByRole('button', { name: 'Create Plan' });
      await user.click(createButton);
      
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();
    });
  });
});