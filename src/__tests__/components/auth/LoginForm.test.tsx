import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn } from 'next-auth/react';
import LoginForm from '@/components/auth/LoginForm';

jest.mock('next-auth/react');

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable check
    process.env.NEXT_PUBLIC_DATABASE_URL = 'postgresql://test';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_DATABASE_URL;
  });

  describe('Database Configuration', () => {
    it('shows database configuration warning when DATABASE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_DATABASE_URL;
      
      render(<LoginForm />);
      
      expect(screen.getByText('Database configuration required to use authentication.')).toBeInTheDocument();
      expect(screen.getByText(/Please set up your environment variables/)).toBeInTheDocument();
      expect(screen.queryByText('Email Address')).not.toBeInTheDocument();
    });

    it('shows login form when database is configured', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Marathon Training Planner')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Sign-In Link' })).toBeInTheDocument();
    });
  });

  describe('Email Sign-In Form', () => {
    it('renders form elements correctly', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Sign-In Link' })).toBeInTheDocument();
      expect(screen.getByText(/We'll send you a secure link/)).toBeInTheDocument();
    });

    it('updates email input value on change', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('calls signIn with correct parameters on form submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<ReturnType<typeof signIn>>);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(mockSignIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        redirect: false,
      });
    });

    it('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('shows success message when email is sent successfully', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<ReturnType<typeof signIn>>);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check your email for the sign-in link!')).toBeInTheDocument();
      });
    });

    it('shows error message when signIn returns an error', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ ok: false, error: 'EmailSignin' } as Awaited<ReturnType<typeof signIn>>);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error sending email. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows generic error message when signIn throws an exception', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error('Network error'));
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('requires email input to be filled', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      await user.click(submitButton);
      
      // Form should not submit with empty email
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('clears message when starting new submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<ReturnType<typeof signIn>>);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Sign-In Link' });
      
      // First submission
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check your email for the sign-in link!')).toBeInTheDocument();
      });
      
      // Clear email and try again
      await user.clear(emailInput);
      await user.type(emailInput, 'another@example.com');
      
      // Click submit again - should clear previous message
      mockSignIn.mockImplementation(() => new Promise(() => {})); // Keep loading
      await user.click(submitButton);
      
      expect(screen.queryByText('Check your email for the sign-in link!')).not.toBeInTheDocument();
    });
  });
});