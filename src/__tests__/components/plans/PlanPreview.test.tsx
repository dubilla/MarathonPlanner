import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanPreview from '@/components/plans/PlanPreview';
import { PlanWithRelations } from '@/services/PlanCreationService';

const mockPlan: PlanWithRelations = {
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
    },
    {
      id: 'week-16',
      planId: 'plan-123',
      weekNumber: 16,
      startDate: '2024-09-30',
      targetMileage: '50.00',
      actualMileage: null,
      notes: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      trainingDays: [
        { id: 'day-16-1', weekId: 'week-16', dayOfWeek: 1, miles: '8.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-16-2', weekId: 'week-16', dayOfWeek: 2, miles: '8.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-16-3', weekId: 'week-16', dayOfWeek: 3, miles: '8.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-16-4', weekId: 'week-16', dayOfWeek: 4, miles: '8.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-16-5', weekId: 'week-16', dayOfWeek: 5, miles: '8.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-16-6', weekId: 'week-16', dayOfWeek: 6, miles: '20.00', description: 'Long Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-16-7', weekId: 'week-16', dayOfWeek: 7, miles: '0.00', description: 'Rest', createdAt: new Date(), updatedAt: new Date() },
      ]
    },
    {
      id: 'week-17',
      planId: 'plan-123',
      weekNumber: 17,
      startDate: '2024-10-07',
      targetMileage: '40.00',
      actualMileage: null,
      notes: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      trainingDays: [
        { id: 'day-17-1', weekId: 'week-17', dayOfWeek: 1, miles: '6.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-17-2', weekId: 'week-17', dayOfWeek: 2, miles: '6.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-17-3', weekId: 'week-17', dayOfWeek: 3, miles: '6.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-17-4', weekId: 'week-17', dayOfWeek: 4, miles: '6.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-17-5', weekId: 'week-17', dayOfWeek: 5, miles: '6.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-17-6', weekId: 'week-17', dayOfWeek: 6, miles: '13.00', description: 'Long Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-17-7', weekId: 'week-17', dayOfWeek: 7, miles: '0.00', description: 'Rest', createdAt: new Date(), updatedAt: new Date() },
      ]
    },
    {
      id: 'week-18',
      planId: 'plan-123',
      weekNumber: 18,
      startDate: '2024-10-14',
      targetMileage: '32.20',
      actualMileage: null,
      notes: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      trainingDays: [
        { id: 'day-18-1', weekId: 'week-18', dayOfWeek: 1, miles: '3.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-18-2', weekId: 'week-18', dayOfWeek: 2, miles: '3.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-18-3', weekId: 'week-18', dayOfWeek: 3, miles: '3.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-18-4', weekId: 'week-18', dayOfWeek: 4, miles: '3.00', description: 'Workout', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-18-5', weekId: 'week-18', dayOfWeek: 5, miles: '3.00', description: 'Easy Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-18-6', weekId: 'week-18', dayOfWeek: 6, miles: '6.00', description: 'Long Run', createdAt: new Date(), updatedAt: new Date() },
        { id: 'day-18-7', weekId: 'week-18', dayOfWeek: 7, miles: '0.00', description: 'Rest', createdAt: new Date(), updatedAt: new Date() },
      ]
    }
  ]
};

describe('PlanPreview', () => {
  const mockOnCreate = jest.fn();
  const mockOnTryAgain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Plan Overview', () => {
    it('displays plan overview information', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText('Training Plan Preview')).toBeInTheDocument();
      expect(screen.getByText('Marathon Training Plan')).toBeInTheDocument();
      expect(screen.getByText(/18-week marathon training plan/)).toBeInTheDocument();
      expect(screen.getByText('October 14, 2024')).toBeInTheDocument();
      expect(screen.getByText('18 weeks')).toBeInTheDocument();
    });

    it('displays total training weeks', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText('Total Weeks:')).toBeInTheDocument();
      expect(screen.getByText('18 weeks')).toBeInTheDocument();
    });

    it('displays marathon date in readable format', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText('Marathon Date:')).toBeInTheDocument();
      expect(screen.getByText('October 14, 2024')).toBeInTheDocument();
    });
  });

  describe('Week Summary', () => {
    it('displays weekly mileage summary', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText('Week 1:')).toBeInTheDocument();
      expect(screen.getByText('25 miles total')).toBeInTheDocument();
      expect(screen.getByText('Week 16 (Peak):')).toBeInTheDocument();
      expect(screen.getByText('60 miles total')).toBeInTheDocument();
    });

    it('highlights taper weeks', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText(/Week 17.*Taper/)).toBeInTheDocument();
      expect(screen.getByText(/Week 18.*Taper/)).toBeInTheDocument();
    });

    it('shows peak week information', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText(/Week 16.*Peak/)).toBeInTheDocument();
      expect(screen.getByText(/20 mile long run/)).toBeInTheDocument();
    });
  });

  describe('Training Schedule', () => {
    it('displays weekly training schedule', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      // Check that days of the week are shown
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
      expect(screen.getByText('Thursday')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('Saturday')).toBeInTheDocument();
      expect(screen.getByText('Sunday')).toBeInTheDocument();
    });

    it('shows workout types correctly', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getAllByText('Easy Run').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Workout').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Long Run').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rest').length).toBeGreaterThan(0);
    });

    it('displays mileage for each day', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      // Check for various mileage amounts from the sample week
      expect(screen.getAllByText('4 miles').length).toBeGreaterThan(0);
      expect(screen.getByText('5 miles')).toBeInTheDocument();
      // Check weekly summary for 20 mile long run
      expect(screen.getByText('(20 mile long run)')).toBeInTheDocument();
    });

    it('shows rest days with 0 miles', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      const restDays = screen.getAllByText('Rest');
      expect(restDays.length).toBeGreaterThan(0);
    });
  });

  describe('Action Buttons', () => {
    it('renders Create and Try Again buttons', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('calls onCreate when Create button is clicked', async () => {
      const user = userEvent.setup();
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Plan' });
      await user.click(createButton);
      
      expect(mockOnCreate).toHaveBeenCalledTimes(1);
    });

    it('calls onTryAgain when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      await user.click(tryAgainButton);
      
      expect(mockOnTryAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('shows loading state for Create button when isCreating is true', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} isCreating={true} />);
      
      const createButton = screen.getByRole('button', { name: 'Creating...' });
      expect(createButton).toBeDisabled();
    });

    it('disables Try Again button when isCreating is true', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} isCreating={true} />);
      
      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      expect(tryAgainButton).toBeDisabled();
    });
  });

  describe('Plan Validation Display', () => {
    it('shows plan meets requirements', () => {
      render(<PlanPreview plan={mockPlan} onCreate={mockOnCreate} onTryAgain={mockOnTryAgain} />);
      
      expect(screen.getByText(/18 weeks total/)).toBeInTheDocument();
      expect(screen.getByText(/6 running days per week/)).toBeInTheDocument();
      expect(screen.getByText(/1 rest day per week/)).toBeInTheDocument();
      expect(screen.getByText(/Tuesday and Thursday workouts/)).toBeInTheDocument();
      expect(screen.getByText(/Saturday long runs/)).toBeInTheDocument();
      expect(screen.getByText(/Last 2 weeks are taper/)).toBeInTheDocument();
    });
  });
});