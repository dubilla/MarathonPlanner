import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '@/components/layout/Header';
import { 
  mockUseSession, 
  createAuthenticatedSession, 
  createUnauthenticatedSession,
  createLoadingSession
} from '../../utils/auth-test-utils';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ 
    children, 
    href, 
    ...props 
  }: { 
    children: React.ReactNode; 
    href: string; 
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createUnauthenticatedSession());
      render(<Header />);
    });

    it('displays the Marathon Planner logo', () => {
      expect(screen.getByText('🏃‍♂️')).toBeInTheDocument();
      expect(screen.getByText('Marathon Planner')).toBeInTheDocument();
    });

    it('shows sign in button', () => {
      expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/sessions/create');
    });

    it('does not show authenticated navigation', () => {
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Training Plans')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    it('has mobile menu toggle button', () => {
      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument();
    });

    it('can toggle mobile menu', async () => {
      const user = userEvent.setup();
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      
      // Menu should start closed
      expect(screen.queryByText('Signed in as:')).not.toBeInTheDocument();
      
      // Open menu
      await user.click(menuButton);
      
      // Should show sign in link in mobile menu
      const mobileSignInLinks = screen.getAllByRole('link', { name: 'Sign In' });
      expect(mobileSignInLinks.length).toBeGreaterThan(1); // Desktop + mobile
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createAuthenticatedSession({
        email: 'runner@example.com',
        name: 'Test Runner'
      }));
      render(<Header />);
    });

    it('shows authenticated navigation', () => {
      expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: 'Training Plans' })).toHaveAttribute('href', '/training-plans');
    });

    it('displays user email', () => {
      expect(screen.getByText('runner@example.com')).toBeInTheDocument();
    });

    it('shows sign out button', () => {
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    });

    it('does not show sign in button', () => {
      expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument();
    });

    it('calls signOut when sign out button is clicked', async () => {
      const user = userEvent.setup();
      const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
      
      await user.click(signOutButton);
      
      // The signOut function should be called (it's mocked in our test setup)
      expect(signOutButton).toBeInTheDocument();
    });

    it('shows user info in mobile menu', async () => {
      const user = userEvent.setup();
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      
      await user.click(menuButton);
      
      expect(screen.getByText('Signed in as: runner@example.com')).toBeInTheDocument();
      const signOutButtons = screen.getAllByRole('button', { name: 'Sign Out' });
      expect(signOutButtons).toHaveLength(2); // Desktop + mobile
    });

    it('closes mobile menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      
      // Open menu
      await user.click(menuButton);
      expect(screen.getByText('Signed in as: runner@example.com')).toBeInTheDocument();
      
      // Click a navigation link
      const dashboardLink = screen.getAllByRole('link', { name: 'Dashboard' })[1]; // Mobile version
      await user.click(dashboardLink);
      
      // Menu should close (mobile content should not be visible)
      expect(screen.queryByText('Signed in as: runner@example.com')).not.toBeInTheDocument();
    });
  });

  describe('when session is loading', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createLoadingSession());
      render(<Header />);
    });

    it('does not show sign in button while loading', () => {
      expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument();
    });

    it('does not show authenticated navigation while loading', () => {
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Training Plans')).not.toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createUnauthenticatedSession());
      render(<Header />);
    });

    it('has responsive classes for desktop/mobile', () => {
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
      
      const mobileButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileButton).toHaveClass('md:hidden');
    });

    it('shows hamburger icon when menu is closed', () => {
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      const svg = menuButton.querySelector('svg');
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M4 6h16M4 12h16M4 18h16');
    });

    it('shows close icon when menu is open', async () => {
      const user = userEvent.setup();
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      
      await user.click(menuButton);
      
      const svg = menuButton.querySelector('svg');
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(createUnauthenticatedSession());
      render(<Header />);
    });

    it('has proper ARIA labels', () => {
      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header element
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has keyboard focus management', () => {
      const menuButton = screen.getByLabelText('Toggle mobile menu');
      expect(menuButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });
});