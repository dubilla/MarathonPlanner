import { renderHook } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import {
  mockUseSession,
  createAuthenticatedSession,
  createLoadingSession,
  createUnauthenticatedSession,
} from "../utils/auth-test-utils";

jest.mock("next-auth/react");

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when user is authenticated", () => {
    it("returns user data and authenticated state", () => {
      const sessionData = createAuthenticatedSession({
        id: "user-123",
        email: "john@example.com",
        name: "John Doe",
      });

      mockUseSession.mockReturnValue(sessionData);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual({
        id: "user-123",
        email: "john@example.com",
        name: "John Doe",
      });
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.signOut).toBe("function");
    });

    it("calls signOut with correct callback URL when signOut is invoked", () => {
      const sessionData = createAuthenticatedSession();
      mockUseSession.mockReturnValue(sessionData);

      const { result } = renderHook(() => useAuth());

      result.current.signOut();

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    });
  });

  describe("when user is not authenticated", () => {
    it("returns null user and not loading state", () => {
      const sessionData = createUnauthenticatedSession();
      mockUseSession.mockReturnValue(sessionData);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.signOut).toBe("function");
    });
  });

  describe("when session is loading", () => {
    it("returns null user and loading state", () => {
      const sessionData = createLoadingSession();
      mockUseSession.mockReturnValue(sessionData);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.signOut).toBe("function");
    });
  });

  describe("when session data exists but user is undefined", () => {
    it("returns null user", () => {
      mockUseSession.mockReturnValue({
        data: { expires: "2024-12-31T23:59:59.999Z" },
        status: "authenticated",
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("when session data is null", () => {
    it("returns null user", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  it("provides signOut function that calls NextAuth signOut", () => {
    const sessionData = createAuthenticatedSession();
    mockUseSession.mockReturnValue(sessionData);

    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signOut).toBe("function");

    // Test that it calls the mocked signOut
    result.current.signOut();
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});
