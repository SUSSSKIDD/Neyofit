'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  registerWithOtp: (data: { email: string; otp: string; name?: string; phone?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'neyofit_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // User data storage (non-sensitive)
  const setUserData = (userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  };

  const getUserData = (): User | null => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  };

  const removeUserData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  };

  // Login function with API integration
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.loginUser({ email, password });
      
      if (response.success && response.data) {
        const { user: userData } = response.data;
        setUserData(userData);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Register function with API integration
  const register = async (userData: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.registerUser(userData);
      
      if (response.success && response.data) {
        const { user: newUser } = response.data;
        setUserData(newUser);
        setUser(newUser);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Login with OTP
  const loginWithOtp = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.verifyOtp({ email, otp, purpose: 'login' });

      if (response.success && response.data) {
        const { user: userData } = response.data;
        setUserData(userData);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'OTP verification failed' };
      }
    } catch (error) {
      console.error('OTP login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Register with OTP
  const registerWithOtp = async (data: { email: string; otp: string; name?: string; phone?: string; password?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.verifyOtp({ ...data, purpose: 'signup' });

      if (response.success && response.data) {
        const { user: userData } = response.data;
        setUserData(userData);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('OTP registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout function with API call
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiService.logoutUser();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      removeUserData();
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  // Check authentication status on app load by verifying token with backend
  const checkAuthStatus = async () => {
    setIsLoading(true);

    try {
      try {
        const response = await apiService.verifyToken();
        if (response.success && response.data?.user) {
          const userData = response.data.user as User;
          setUser(userData);
          setUserData(userData);
        } else {
          // Token is invalid or expired - try to refresh
          removeUserData();
          setUser(null);
        }
      } catch {
        // Network error - fall back to stored data
        const userData = getUserData();
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for 401 unauthorized events to auto-logout
  useEffect(() => {
    const handleUnauthorized = () => {
      removeUserData();
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [router]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    loginWithOtp,
    registerWithOtp,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };