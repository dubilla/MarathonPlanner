export const useSession = jest.fn();
export const signIn = jest.fn();
export const signOut = jest.fn();

export const SessionProvider = ({ children }: { children: React.ReactNode }) =>
  children;

export const getSession = jest.fn();
