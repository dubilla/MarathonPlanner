import { render } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { ReactElement } from 'react';

export interface MockSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires?: string;
}

export interface MockSessionReturn {
  data: MockSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

export const renderWithAuth = (
  component: ReactElement,
  sessionState: MockSessionReturn = {
    data: null,
    status: 'unauthenticated'
  }
) => {
  mockUseSession.mockReturnValue(sessionState);
  return render(component);
};

export const createMockSession = (overrides: Partial<MockSession> = {}): MockSession => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides.user
  },
  expires: '2024-12-31T23:59:59.999Z',
  ...overrides
});

export const createAuthenticatedSession = (userOverrides?: Partial<MockSession['user']>): MockSessionReturn => ({
  data: createMockSession({ user: userOverrides }),
  status: 'authenticated'
});

export const createLoadingSession = (): MockSessionReturn => ({
  data: null,
  status: 'loading'
});

export const createUnauthenticatedSession = (): MockSessionReturn => ({
  data: null,
  status: 'unauthenticated'
});

// This file contains test utilities - no tests needed here
describe('auth-test-utils', () => {
  it('exports utility functions', () => {
    expect(typeof renderWithAuth).toBe('function');
    expect(typeof createMockSession).toBe('function');
    expect(typeof createAuthenticatedSession).toBe('function');
    expect(typeof createLoadingSession).toBe('function');
    expect(typeof createUnauthenticatedSession).toBe('function');
  });
});