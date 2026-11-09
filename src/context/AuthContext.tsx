import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('roar_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('roar_admin_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        } else {
          localStorage.removeItem('roar_admin_token');
          setToken(null);
          setAdmin(null);
        }
      } catch {
        // Network failure, retain cached token or clear if unauthorized
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (newToken: string, user: AdminUser) => {
    localStorage.setItem('roar_admin_token', newToken);
    setToken(newToken);
    setAdmin(user);
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('roar_admin_token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

