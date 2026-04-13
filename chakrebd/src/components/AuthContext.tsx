'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMe, getToken, loginUser, registerUser, setToken, type ApiUser } from '@/lib/api';

interface AuthContextType {
  ready: boolean;
  isLoggedIn: boolean;
  user: ApiUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    profile?: { countryCode?: string; localArea?: string; interests?: string[] }
  ) => Promise<{ ok: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setReady(true);
      return;
    }
    fetchMe().then((r) => {
      if (r.ok) {
        setUser(r.user);
        setIsLoggedIn(true);
      } else {
        setToken(null);
      }
      setReady(true);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await loginUser(email, password);
    if (!r.ok) return { ok: false, error: r.error };
    setToken(r.token);
    setUser(r.user);
    setIsLoggedIn(true);
    return { ok: true };
  }, []);

  const refreshUser = useCallback(async () => {
    const r = await fetchMe();
    if (r.ok) setUser(r.user);
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      profile?: { countryCode?: string; localArea?: string; interests?: string[] }
    ) => {
      const r = await registerUser(name, email, password, profile);
      if (!r.ok) return { ok: false, error: r.error };
      setToken(r.token);
      setUser(r.user);
      setIsLoggedIn(true);
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ ready, isLoggedIn, user, login, register, refreshUser, logout }}>
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
