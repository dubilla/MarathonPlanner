import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/hooks/useAuth';
import NewPlanForm from '@/components/plans/NewPlanForm';

jest.mock('@/hooks/useAuth');
jest.mock('@/services/PlanCreationService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: null,
  image: null,
  password: null
};

describe('NewPlanForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null
    });
  });

  describe('Form Rendering', () => {
    it('renders form elements correctly', () => {
      render(<NewPlanForm />);
      
      expect(screen.getByText('Create Marathon Training Plan')).toBeInTheDocument();
      expect(screen.getByLabelText('Marathon Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Longest Run Distance (miles)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeInTheDocument();
    });

    it('has HTML5 validation for required fields', () => {
      render(<NewPlanForm />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date') as HTMLInputElement;
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)') as HTMLInputElement;
      
      expect(marathonDateInput.required).toBe(true);
      expect(longestRunInput.required).toBe(true);
      expect(longestRunInput.type).toBe('number');
      expect(longestRunInput.min).toBe('1');
      expect(longestRunInput.max).toBe('30');
    });

    it('shows form description', () => {
      render(<NewPlanForm />);
      
      expect(screen.getByText(/This will create an 18-week training plan/)).toBeInTheDocument();
      expect(screen.getByText(/ending on your marathon date/)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates marathon date input value on change', async () => {
      const user = userEvent.setup();
      render(<NewPlanForm />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date') as HTMLInputElement;
      await user.type(marathonDateInput, '2024-10-15');
      
      expect(marathonDateInput.value).toBe('2024-10-15');
    });

    it('updates longest run input value on change', async () => {
      const user = userEvent.setup();
      render(<NewPlanForm />);
      
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)') as HTMLInputElement;
      await user.type(longestRunInput, '20');
      
      expect(longestRunInput.value).toBe('20');
    });

    it('requires both fields to be filled before submitting', async () => {
      const user = userEvent.setup();
      render(<NewPlanForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      await user.click(submitButton);
      
      // Form should not submit with empty fields - HTML5 validation should prevent it
      expect(screen.queryByText('Creating your training plan...')).not.toBeInTheDocument();
    });

    it('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      
      const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(longestRunInput, '20');
      await user.click(submitButton);
      
      expect(screen.getByText('Creating your training plan...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('calls onSubmit with correct parameters', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(longestRunInput, '20');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        marathonDate: new Date(futureDateString),
        longestRunMiles: 20,
        userId: 'user-123'
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when submission fails', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(longestRunInput, '20');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create plan. Please try again.')).toBeInTheDocument();
      });
    });

    it('clears error message on new submission', async () => {
      const userEvent_setup = userEvent.setup();
      const mockOnSubmit = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementation(() => new Promise(() => {})); // Keep loading on second attempt
      
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      // First submission - should fail
      await userEvent_setup.type(marathonDateInput, futureDateString);
      await userEvent_setup.type(longestRunInput, '20');
      await userEvent_setup.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create plan. Please try again.')).toBeInTheDocument();
      });
      
      // Second submission - should clear error and show loading
      await userEvent_setup.click(submitButton);
      
      expect(screen.queryByText('Failed to create plan. Please try again.')).not.toBeInTheDocument();
      expect(screen.getByText('Creating your training plan...')).toBeInTheDocument();
    });

    it('validates marathon date is in the future', async () => {
      const userSetup = userEvent.setup();
      const mockOnSubmit = jest.fn();
      
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Set date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      await userSetup.type(marathonDateInput, yesterdayString);
      await userSetup.type(longestRunInput, '20');
      await userSetup.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Marathon date must be at least 18 weeks in the future.')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates longest run is within reasonable range', () => {
      render(<NewPlanForm />);
      
      const longestRunInput = screen.getByLabelText('Longest Run Distance (miles)') as HTMLInputElement;
      
      // HTML5 validation should prevent values outside 1-30 range
      expect(longestRunInput.min).toBe('1');
      expect(longestRunInput.max).toBe('30');
    });
  });

  describe('Authentication', () => {
    it('shows error when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null
      });
      
      render(<NewPlanForm />);
      
      expect(screen.getByText('You must be logged in to create a training plan.')).toBeInTheDocument();
      expect(screen.queryByLabelText('Marathon Date')).not.toBeInTheDocument();
    });

    it('shows loading state when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null
      });
      
      render(<NewPlanForm />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByLabelText('Marathon Date')).not.toBeInTheDocument();
    });
  });
});