import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface User {
  id: number;
  uuid: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'owner' | 'student';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('abhyasika_token');
    if (savedToken) {
      setToken(savedToken);
      api.auth.me().then((res: any) => {
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('abhyasika_token');
        setToken(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await api.auth.login({ email, password });
    localStorage.setItem('abhyasika_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (data: any) => {
    const res: any = await api.auth.register(data);
    // Owner accounts need approval - no token is issued
    if (res.data?.pending_approval) {
      // Return the pending info so the UI can show a message
      throw Object.assign(new Error('PENDING_APPROVAL'), { pending_approval: true, message: res.message });
    }
    localStorage.setItem('abhyasika_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    localStorage.removeItem('abhyasika_token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, loading,
      isAdmin: user?.role === 'super_admin',
      isOwner: user?.role === 'owner',
      isStudent: user?.role === 'student'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
