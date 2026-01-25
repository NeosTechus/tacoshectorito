import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  guestId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (credential: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initGuestSession: () => Promise<void>;
  convertToUser: (data: { email: string; password: string; name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fiesta_auth_token';
const USER_KEY = 'fiesta_user';
const GUEST_KEY = 'fiesta_guest_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    const savedGuestId = localStorage.getItem(GUEST_KEY);

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else if (savedGuestId) {
        setGuestId(savedGuestId);
      }
    }
    setIsLoading(false);
  }, []);

  const initGuestSession = useCallback(async () => {
    if (token || guestId) return; // Already have a session

    try {
      const result = await authApi.guestSession();
      if (result.token && result.guestId) {
        setToken(result.token);
        setGuestId(result.guestId);
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(GUEST_KEY, result.guestId);
      }
    } catch (error) {
      console.error('Failed to init guest session:', error);
    }
  }, [token, guestId]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await authApi.login({ email, password });
      if (result.error) {
        return { success: false, error: result.error };
      }

      setToken(result.token);
      setUser(result.user);
      setGuestId(null);
      
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      localStorage.removeItem(GUEST_KEY);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name?: string; phone?: string }) => {
    try {
      const result = await authApi.register(data);
      if (result.error) {
        return { success: false, error: result.error };
      }

      setToken(result.token);
      setUser(result.user);
      setGuestId(null);

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      localStorage.removeItem(GUEST_KEY);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    try {
      const result = await authApi.googleLogin(credential);
      if (result.error) {
        return { success: false, error: result.error };
      }

      setToken(result.token);
      setUser(result.user);
      setGuestId(null);

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      localStorage.removeItem(GUEST_KEY);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google login failed' };
    }
  }, []);

  const convertToUser = useCallback(async (data: { email: string; password: string; name?: string; phone?: string }) => {
    if (!guestId) {
      return { success: false, error: 'No guest session to convert' };
    }

    try {
      const result = await authApi.convertGuestToUser({ ...data, guestId });
      if (result.error) {
        return { success: false, error: result.error };
      }

      setToken(result.token);
      setUser(result.user);
      setGuestId(null);

      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      localStorage.removeItem(GUEST_KEY);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Conversion failed' };
    }
  }, [guestId]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setGuestId(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GUEST_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        guestId,
        token,
        isAuthenticated: !!user,
        isGuest: !!guestId && !user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        initGuestSession,
        convertToUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
