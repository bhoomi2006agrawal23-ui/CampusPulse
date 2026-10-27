import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setMemoryAccessToken, getMemoryAccessToken } from '../api/client.js';

export type UserRole = 'Student' | 'Organizer' | 'Judge' | 'Volunteer' | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  collegeName?: string;
  phoneNumber?: string;
  bio?: string;
  profileInfo?: {
    collegeName?: string;
    department?: string;
    studentId?: string;
    year?: number;
    avatarUrl?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: UserRole, collegeName?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    collegeName?: string;
    phoneNumber?: string;
    bio?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Silent session restore on app mount using HttpOnly refresh cookie
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiClient<{ accessToken: string; user: UserProfile }>('/api/auth/refresh', {
        method: 'POST',
        skipAuth: true,
      });

      if (res.success && res.data) {
        setMemoryAccessToken(res.data.accessToken);
        setAccessTokenState(res.data.accessToken);
        setUser(res.data.user);
        return true;
      } else {
        setMemoryAccessToken(null);
        setAccessTokenState(null);
        setUser(null);
        return false;
      }
    } catch {
      setMemoryAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string, role?: UserRole, collegeName?: string) => {
    setError(null);
    try {
      const res = await apiClient<{ user: UserProfile; accessToken: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...(role ? { role } : {}),
          ...(collegeName ? { collegeName } : {}),
        }),
        skipAuth: true,
      });

      if (res.success && res.data) {
        // Enforce strict client-side role consistency check
        if (role && res.data.user.role !== role) {
          const mismatchMsg = `Account role mismatch. This account is registered as a ${res.data.user.role}, not ${role}. Please select ${res.data.user.role} to continue.`;
          setError(mismatchMsg);
          setMemoryAccessToken(null);
          setAccessTokenState(null);
          setUser(null);
          return { success: false, error: mismatchMsg };
        }

        // Enforce client-side college affiliation consistency check
        if (
          collegeName &&
          res.data.user.collegeName &&
          res.data.user.collegeName.toLowerCase().trim() !== collegeName.toLowerCase().trim()
        ) {
          const mismatchMsg = `College affiliation mismatch. This account is registered under "${res.data.user.collegeName}", not "${collegeName.trim()}".`;
          setError(mismatchMsg);
          setMemoryAccessToken(null);
          setAccessTokenState(null);
          setUser(null);
          return { success: false, error: mismatchMsg };
        }

        setMemoryAccessToken(res.data.accessToken);
        setAccessTokenState(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      } else {
        const errorMsg = res.error?.message || 'Authentication failed. Please verify credentials.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login network failure';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    collegeName?: string;
    phoneNumber?: string;
    bio?: string;
  }) => {
    setError(null);
    try {
      const res = await apiClient<{ user: UserProfile; accessToken: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      });

      if (res.success && res.data) {
        setMemoryAccessToken(res.data.accessToken);
        setAccessTokenState(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      } else {
        const errorMsg = res.error?.message || 'Registration failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration network failure';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    } finally {
      setMemoryAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: accessTokenState,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
