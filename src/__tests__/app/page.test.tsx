import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { 
  mockUseSession, 
  createUnauthenticatedSession 
} from '../utils/auth-test-utils';

// Mock Next.js Link component
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

describe('Landing Page', () => {
  beforeEach(() => {
    // Mock unauthenticated state for the header
    mockUseSession.mockReturnValue(createUnauthenticatedSession());
    render(<Home />);
  });

  describe('Hero Section', () => {
    it('displays the main headline', () => {
      expect(screen.getByRole('heading', { level: 1, name: 'Marathon Training' })).toBeInTheDocument();
      expect(screen.getByText('Made Simple')).toBeInTheDocument();
    });

    it('displays the value proposition', () => {
      expect(
        screen.getByText(/Create, track, and complete your marathon training plans with detailed progress monitoring and analytics/)
      ).toBeInTheDocument();
    });

    it('has call-to-action buttons with correct links', () => {
      const getStartedButton = screen.getByRole('link', { name: 'Get Started' });
      const learnMoreButton = screen.getByRole('link', { name: 'Learn More' });

      expect(getStartedButton).toHaveAttribute('href', '/users/create');
      expect(learnMoreButton).toHaveAttribute('href', '#features');
    });

    it('has primary CTA button styled prominently', () => {
      const getStartedButton = screen.getByRole('link', { name: 'Get Started' });
      expect(getStartedButton).toHaveClass('bg-blue-600');
    });
  });

  describe('Feature Overview Section', () => {
    it('displays all three feature cards', () => {
      expect(screen.getByText('Plan Management')).toBeInTheDocument();
      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
      expect(screen.getByText('Goal Achievement')).toBeInTheDocument();
    });

    it('has feature descriptions', () => {
      expect(
        screen.getByText(/Create detailed training plans with weekly schedules/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Log your daily runs, track actual vs planned mileage/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Stay motivated with visual progress indicators/)
      ).toBeInTheDocument();
    });

    it('has features section with correct ID for anchor linking', () => {
      const featuresSection = screen.getByText('Plan Management').closest('section');
      expect(featuresSection).toHaveAttribute('id', 'features');
    });
  });

  describe('How It Works Section', () => {
    it('displays all four steps', () => {
      expect(screen.getByText('Create Your Plan')).toBeInTheDocument();
      expect(screen.getByText('Track Workouts')).toBeInTheDocument();
      expect(screen.getByText('Monitor Progress')).toBeInTheDocument();
      expect(screen.getByText('Achieve Your Goals')).toBeInTheDocument();
    });

    it('has numbered step indicators', () => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Secondary CTA Section', () => {
    it('has additional sign-up call-to-action', () => {
      expect(screen.getByText('Ready to Start Training?')).toBeInTheDocument();
      expect(
        screen.getByText('Join thousands of runners achieving their marathon goals')
      ).toBeInTheDocument();
    });

    it('has sign-up button linking to auth', () => {
      const signUpButton = screen.getByRole('link', { name: 'Sign Up Free' });
      expect(signUpButton).toHaveAttribute('href', '/users/create');
    });
  });

  describe('Footer', () => {
    it('displays app branding', () => {
      // Look for the footer specifically - the brand appears in header too
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveTextContent('Marathon Planner');
      expect(
        screen.getByText('Your training companion for marathon success. Create, track, and complete your marathon training plans.')
      ).toBeInTheDocument();
    });

    it('has copyright information', () => {
      expect(
        screen.getByText(/© 2024 Marathon Planner. Built for runners, by runners./)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation and User Interactions', () => {
    it('allows smooth scrolling to features section', () => {
      const learnMoreButton = screen.getByRole('link', { name: 'Learn More' });
      
      // Test that the link points to the features section
      expect(learnMoreButton).toHaveAttribute('href', '#features');
      
      // Note: In a real browser, clicking would trigger smooth scrolling
      // We just verify the href is correct for this unit test
    });

    it('directs users to auth page for sign-up', () => {
      const authLinks = screen.getAllByRole('link', { name: /Get Started|Sign Up Free/ });
      
      authLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/users/create');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Marathon Training');
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings).toHaveLength(2); // "How It Works" and "Ready to Start Training?"
      
      const featureHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(featureHeadings.length).toBeGreaterThan(0);
    });

    it('has descriptive link text', () => {
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('uses semantic HTML structure', () => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });
  });

  describe('Visual Design Elements', () => {
    it('applies gradient background styling', () => {
      // Find the root container div with the gradient background
      const container = document.querySelector('.bg-gradient-to-br');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-blue-50', 'to-indigo-100');
    });

    it('has responsive design classes', () => {
      const headline = screen.getByText('Marathon Training');
      expect(headline).toHaveClass('text-5xl', 'md:text-6xl');
    });

    it('has consistent blue theme throughout', () => {
      const primaryButton = screen.getByRole('link', { name: 'Get Started' });
      expect(primaryButton).toHaveClass('bg-blue-600');
      
      const ctaSection = screen.getByText('Ready to Start Training?').closest('section');
      expect(ctaSection).toHaveClass('bg-blue-600');
    });
  });

  describe('Content Quality', () => {
    it('has clear and compelling copy', () => {
      // Test that key value propositions are present
      expect(screen.getByText(/detailed progress monitoring and analytics/)).toBeInTheDocument();
      expect(screen.getByText(/Cross the marathon finish line prepared and confident/)).toBeInTheDocument();
    });

    it('uses action-oriented language', () => {
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Ready to Start Training?')).toBeInTheDocument();
      expect(screen.getByText('Sign Up Free')).toBeInTheDocument();
    });
  });
});