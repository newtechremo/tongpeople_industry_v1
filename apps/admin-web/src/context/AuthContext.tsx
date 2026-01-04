import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { AuthUser } from '@/api/auth';
import { login as apiLogin, signOut, getCurrentUser, onAuthStateChange } from '@/api/auth';

// Types
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiLogin(phone, password);

      if (!result.success) {
        const errorMessage = result.error || '로그인에 실패했습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Login successful, refresh user
      await refreshUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그아웃에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial session check
  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser();
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        await refreshUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  // Render
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
