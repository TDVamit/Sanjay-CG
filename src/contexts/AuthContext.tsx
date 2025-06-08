import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, tokenManager } from '../services/api';
import type { UserResponse, LoginRequest, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenManager.getAccessToken();
      
      if (token && !tokenManager.isTokenExpired(token)) {
        try {
          const userData = await authAPI.me();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          tokenManager.clearTokens();
        }
      } else {
        // Check if user data exists in localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error('Failed to parse saved user data:', error);
            localStorage.removeItem('user');
          }
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Login and get tokens
      const loginResponse = await authAPI.login(credentials);
      tokenManager.setTokens(loginResponse.access_token, loginResponse.refresh_token);
      
      // Get user data
      const userData = await authAPI.me();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Extract error message
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Register user
      await authAPI.register(userData);
      
      // Auto login after successful registration
      await login({
        username: userData.username,
        password: userData.password
      });
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Extract error message
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = 'User with this username or email already exists.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint
      await authAPI.logout();
      
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state and tokens
      setUser(null);
      tokenManager.clearTokens();
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, logout the user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 