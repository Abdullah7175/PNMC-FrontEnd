'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { authApi, User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearSession() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await authApi.me();
      if (data.isMobileUser) {
        clearSession();
        setUser(null);
        return;
      }
      setUser(data);
    } catch {
      setUser(null);
      clearSession();
    }
  };

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authApi.login(email, password);
      if (data.user.isMobileUser) {
        clearSession();
        throw new Error(
          'Mobile field users cannot sign in here. Please use the PNMC Field Inspector mobile app.',
        );
      }
      Cookies.set('accessToken', data.accessToken, { expires: 1 });
      Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
      setUser(data.user);
    } catch (err) {
      clearSession();
      setUser(null);
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          throw new Error(
            'Cannot reach the API server. Make sure the backend is running on port 3001.',
          );
        }
        const message =
          (err.response?.data as { message?: string | string[] })?.message;
        const text = Array.isArray(message)
          ? message.join(', ')
          : message || 'Invalid email or password';
        throw new Error(text);
      }
      throw err;
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
