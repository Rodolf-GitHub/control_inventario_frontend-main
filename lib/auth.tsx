"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type UserInfo = {
  id?: number | null;
  username?: string;
  permisos?: any[] | null;
  es_superusuario?: boolean;
};

type AuthContextType = {
  token: string | null;
  user: UserInfo | null;
  login: (res: { token: string | null; id?: number | null; username?: string; permisos?: any[] | null; es_superusuario?: boolean }) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const me = localStorage.getItem('me');
      if (t) setToken(t);
      if (me) {
        setUser(JSON.parse(me));
      } else if (t) {
        // intentar parsear el token JWT para obtener datos del usuario (permisos, username, etc.)
        try {
          const parsed = parseToken(t);
          if (parsed) {
            const u = { id: parsed.id ?? null, username: parsed.username, permisos: parsed.permisos ?? null, es_superusuario: !!parsed.es_superusuario };
            setUser(u);
            try {
              localStorage.setItem('me', JSON.stringify(u));
            } catch {}
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const login = (res: { token: string | null; id?: number | null; username?: string; permisos?: any[] | null; es_superusuario?: boolean }) => {
    setToken(res.token || null);
    const u = { id: res.id ?? null, username: res.username, permisos: res.permisos ?? null, es_superusuario: !!res.es_superusuario };
    setUser(u);
    try {
      if (res.token) localStorage.setItem('token', res.token);
      localStorage.setItem('me', JSON.stringify(u));
    } catch {}
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('me');
    } catch {}
  };

  const value: AuthContextType = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function parseToken(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
