import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';
import { apiClient } from '../lib/api';

const STAFF_ROLES = ['admin', 'super_admin', 'support'] as const;
type StaffRole = typeof STAFF_ROLES[number];

export const isSuperAdmin = (role?: string): boolean => role === 'super_admin';
export const isAdminOrAbove = (role?: string): boolean => role === 'admin' || role === 'super_admin';
export const isStaff = (role?: string): boolean => STAFF_ROLES.includes(role as StaffRole);

export function RoleGuard({
  roles,
  children,
  fallback,
}: {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <>{fallback ?? <Navigate to="/dashboard" replace />}</>;
  }
  return <>{children}</>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (STAFF_ROLES.includes(parsedUser.role as StaffRole)) {
          setToken(storedToken);
          setUser(parsedUser);
          apiClient.setToken(storedToken);
        } else {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    
    if (response.success && response.data) {
      const { token: newToken, user: userData } = response.data;
      
      if (!STAFF_ROLES.includes(userData.role as StaffRole)) {
        throw new Error('Access denied. Staff privileges required.');
      }
      
      setToken(newToken);
      setUser(userData);
      apiClient.setToken(newToken);
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(userData));
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
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
