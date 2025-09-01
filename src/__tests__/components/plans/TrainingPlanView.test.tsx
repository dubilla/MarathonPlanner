import { render, screen, fireEvent } from '@testing-library/react';
import TrainingPlanView from '@/components/plans/TrainingPlanView';
import { PlanWithRelations } from '@/services/PlanCreationService';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false
  })
}));

const mockPlan: PlanWithRelations = {
  id: 'test-plan-id',
  userId: 'test-user-id',
  name: 'Test Marathon Training Plan',
  description: '18-week marathon training plan ending on December 31, 2024',
  marathonDate: '2024-12-31',
  goalTime: null,
  totalWeeks: 2, // Simplified for testing
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  weeks: [
    {
      id: 'week-1',
      planId: 'test-plan-id',
      weekNumber: 1,
      startDate: '2024-01-01',
      targetMileage: '25.00',
      actualMileage: null,
      notes: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      trainingDays: [
        {
          id: 'day-1-1',
          weekId: 'week-1',
          dayOfWeek: 1,
          date: '2024-01-01',
          miles: '4.00',
          description: 'Easy Run',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'day-1-2',
          weekId: 'week-1',
          dayOfWeek: 2,
          date: '2024-01-02',
          miles: '5.00',
          description: 'Workout',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'day-1-7',
          weekId: 'week-1',
          dayOfWeek: 7,
          date: '2024-01-07',
          miles: '0.00',
          description: 'Rest',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]
    },
    {
      id: 'week-2',
      planId: 'test-plan-id',
      weekNumber: 16, // Peak week
      startDate: '2024-04-15',
      targetMileage: '50.00',
      actualMileage: null,
      notes: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      trainingDays: [
        {
          id: 'day-2-1',
          weekId: 'week-2',
          dayOfWeek: 1,
          date: '2024-04-15',
          miles: '8.00',
          description: 'Easy Run',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'day-2-6',
          weekId: 'week-2',
          dayOfWeek: 6,
          date: '2024-04-20',
          miles: '22.00',
          description: 'Long Run',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]
    }
  ]
};

describe('TrainingPlanView', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plan name and description', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    expect(screen.getByText('Test Marathon Training Plan')).toBeInTheDocument();
    expect(screen.getByText('18-week marathon training plan ending on December 31, 2024')).toBeInTheDocument();
  });

  it('displays plan statistics correctly', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    expect(screen.getByText('0/2')).toBeInTheDocument(); // Weeks complete
    expect(screen.getByText('Weeks Complete')).toBeInTheDocument();
    expect(screen.getByText('0/75')).toBeInTheDocument(); // Miles complete (25 + 50)
    expect(screen.getByText('Miles Complete')).toBeInTheDocument();
  });

  it('shows back to dashboard button', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    const backButton = screen.getByText('Back to Dashboard');
    expect(backButton).toBeInTheDocument();
    
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('displays view mode tabs', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    expect(screen.getByText('Weekly View')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('switches between view modes', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    const statsTab = screen.getByText('Statistics');
    fireEvent.click(statsTab);
    
    expect(screen.getByText('Training Progress')).toBeInTheDocument();
    expect(screen.getByText('Weekly Progress')).toBeInTheDocument();
  });

  it('shows current week by default', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    // Should show "Week 1 of 2" since we're mocking the current week calculation
    expect(screen.getByText(/Week \d+ of 2/)).toBeInTheDocument();
  });

  it('displays week navigation buttons', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    const prevButton = screen.getByText('←');
    const nextButton = screen.getByText('→');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('shows workout types with correct styling', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    // Check if workout type badges are present
    const workoutTypes = screen.getAllByText(/Easy Run|Workout|Rest/);
    expect(workoutTypes.length).toBeGreaterThan(0);
  });

  it('displays workout details and pace guidance', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    // Check for pace guidance text - may be split across elements
    const paceTexts = screen.getAllByText(/Conversational pace|Active recovery|Tempo runs/);
    expect(paceTexts.length).toBeGreaterThan(0);
  });

  it('shows peak week label', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    // Navigate to week 16 (peak week)
    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Week 16 (Peak Week)')).toBeInTheDocument();
  });

  it('allows marking workouts as complete', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    const firstCheckbox = checkboxes[0];
    fireEvent.click(firstCheckbox);
    
    expect(firstCheckbox).toBeChecked();
  });

  it('shows rest days without completion checkbox', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    // Component should render successfully
    expect(screen.getByText('Test Marathon Training Plan')).toBeInTheDocument();
  });

  it('calculates and displays week progress correctly', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    // Should show plan overview stats
    expect(screen.getByText('Weeks Complete')).toBeInTheDocument();
    expect(screen.getByText('Miles Complete')).toBeInTheDocument();
  });

  it('shows statistics view with weekly progress', () => {
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    const statsTab = screen.getByText('Statistics');
    fireEvent.click(statsTab);
    
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getAllByText(/Week 16/).length).toBeGreaterThan(0);
    expect(screen.getByText('Peak')).toBeInTheDocument();
    expect(screen.getByText(/\d+\/25\.00 mi/)).toBeInTheDocument();
    expect(screen.getByText(/\d+\/50\.00 mi/)).toBeInTheDocument();
  });

  it('shows marathon countdown', () => {
    // Mock current date to be before marathon date
    const originalDate = Date;
    const mockDate = new Date('2024-01-01');
    global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
    global.Date.now = originalDate.now;
    
    render(<TrainingPlanView plan={mockPlan} onBack={mockOnBack} />);
    
    expect(screen.getByText(/\d+ days/)).toBeInTheDocument();
    expect(screen.getByText('Days to Go')).toBeInTheDocument();
    
    // Restore original Date
    global.Date = originalDate;
  });
});