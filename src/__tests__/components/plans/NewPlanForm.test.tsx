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
      expect(screen.getByLabelText('Peak Weekly Mileage (miles)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeInTheDocument();
    });

    it('has HTML5 validation for required fields', () => {
      render(<NewPlanForm />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date') as HTMLInputElement;
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)') as HTMLInputElement;
      
      expect(marathonDateInput.required).toBe(true);
      expect(peakMileageInput.required).toBe(true);
      expect(peakMileageInput.type).toBe('number');
      expect(peakMileageInput.min).toBe('20');
      expect(peakMileageInput.max).toBe('100');
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

    it('updates peak mileage input value on change', async () => {
      const user = userEvent.setup();
      render(<NewPlanForm />);
      
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)') as HTMLInputElement;
      await user.type(peakMileageInput, '50');
      
      expect(peakMileageInput.value).toBe('50');
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
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      expect(screen.getByText('Creating your training plan...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('calls onSubmit with correct parameters', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        marathonDate: new Date(futureDateString),
        longestWeeklyMileage: 50,
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
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await user.type(marathonDateInput, futureDateString);
      await user.type(peakMileageInput, '50');
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
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Use a date that's definitely 18+ weeks in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 130); // About 19 weeks
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      // First submission - should fail
      await userEvent_setup.type(marathonDateInput, futureDateString);
      await userEvent_setup.type(peakMileageInput, '50');
      await userEvent_setup.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create plan. Please try again.')).toBeInTheDocument();
      });
      
      // Second submission - should clear error and show loading
      await userEvent_setup.click(submitButton);
      
      expect(screen.queryByText('Failed to create plan. Please try again.')).not.toBeInTheDocument();
      expect(screen.getByText('Creating your training plan...')).toBeInTheDocument();
    });

    it('allows marathon date in the past to create plan with historical training days', async () => {
      const userSetup = userEvent.setup();
      const mockOnSubmit = jest.fn();
      
      render(<NewPlanForm onSubmit={mockOnSubmit} />);
      
      const marathonDateInput = screen.getByLabelText('Marathon Date');
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)');
      const submitButton = screen.getByRole('button', { name: 'Create Plan' });
      
      // Set date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      await userSetup.clear(marathonDateInput);
      await userSetup.type(marathonDateInput, yesterdayString);
      await userSetup.clear(peakMileageInput);
      await userSetup.type(peakMileageInput, '50');
      await userSetup.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          marathonDate: new Date(yesterdayString),
          longestWeeklyMileage: 50,
          userId: 'user-123'
        });
      });
    });

    it('validates peak weekly mileage is within reasonable range', () => {
      render(<NewPlanForm />);
      
      const peakMileageInput = screen.getByLabelText('Peak Weekly Mileage (miles)') as HTMLInputElement;
      
      // HTML5 validation should prevent values outside 20-100 range
      expect(peakMileageInput.min).toBe('20');
      expect(peakMileageInput.max).toBe('100');
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