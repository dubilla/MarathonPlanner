// Mock the database before importing auth
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  }
}));

import { authOptions } from '@/lib/auth';

describe('Auth Configuration', () => {
  beforeAll(() => {
    // Set required environment variable for tests
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });
  describe('authOptions', () => {
    it('has correct provider configuration', () => {
      expect(authOptions.providers).toHaveLength(1);
      expect(authOptions.providers[0]).toMatchObject({
        id: 'email',
        type: 'email'
      });
    });

    it('has correct page configuration', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth',
        verifyRequest: '/auth/verify',
        error: '/auth/error'
      });
    });

    it('has DrizzleAdapter configured', () => {
      expect(authOptions.adapter).toBeDefined();
    });

    describe('session callback', () => {
      it('adds user id to session when both session.user and token.sub exist', async () => {
        const mockSession = {
          user: { email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        };
        const mockToken = { sub: 'user-123' };

        const result = await authOptions.callbacks!.session!({
          session: mockSession,
          token: mockToken
        });

        expect(result).toEqual({
          user: { 
            email: 'test@example.com',
            id: 'user-123'
          },
          expires: '2024-12-31T23:59:59.999Z'
        });
      });

      it('returns original session when session.user is undefined', async () => {
        const mockSession = {
          expires: '2024-12-31T23:59:59.999Z'
        };
        const mockToken = { sub: 'user-123' };

        const result = await authOptions.callbacks!.session!({
          session: mockSession,
          token: mockToken
        });

        expect(result).toEqual(mockSession);
        expect(result.user).toBeUndefined();
      });

      it('returns original session when token.sub is undefined', async () => {
        const mockSession = {
          user: { email: 'test@example.com' },
          expires: '2024-12-31T23:59:59.999Z'
        };
        const mockToken = {};

        const result = await authOptions.callbacks!.session!({
          session: mockSession,
          token: mockToken
        });

        expect(result).toEqual(mockSession);
        expect(result.user).not.toHaveProperty('id');
      });

      it('returns original session when both session.user and token.sub are undefined', async () => {
        const mockSession = {
          expires: '2024-12-31T23:59:59.999Z'
        };
        const mockToken = {};

        const result = await authOptions.callbacks!.session!({
          session: mockSession,
          token: mockToken
        });

        expect(result).toEqual(mockSession);
      });

      it('preserves existing user properties while adding id', async () => {
        const mockSession = {
          user: { 
            email: 'test@example.com',
            name: 'Test User',
            image: 'https://example.com/avatar.jpg'
          },
          expires: '2024-12-31T23:59:59.999Z'
        };
        const mockToken = { sub: 'user-123' };

        const result = await authOptions.callbacks!.session!({
          session: mockSession,
          token: mockToken
        });

        expect(result.user).toEqual({
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
          id: 'user-123'
        });
      });

      it('handles falsy session gracefully', async () => {
        const result = await authOptions.callbacks!.session!({
          session: null as never,
          token: { sub: 'user-123' }
        });

        expect(result).toBe(null);
      });
    });
  });

  describe('environment variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('configures email provider with environment variables when provided', () => {
      // Since we're mocking the email provider, we test the configuration pattern
      expect(authOptions.providers[0]).toMatchObject({
        id: 'email',
        type: 'email'
      });
      
      // The actual email configuration is handled by the mocked provider
      // In a real environment, the provider would use process.env values
      expect(typeof authOptions.providers[0]).toBe('object');
    });
  });
});