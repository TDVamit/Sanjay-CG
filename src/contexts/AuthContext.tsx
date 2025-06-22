import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, tokenManager, tokenRefreshManager } from '../services/api';
import type { UserResponse, LoginRequest, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  uploadProfile: (file: File) => Promise<void>;
  removeProfile: () => Promise<void>;
  getTokenTimeRemaining: () => string;
  getUserRole: () => string | null;
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
          console.log('User data received:', userData);
          console.log('User role:', userData.user_role);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          // Store user role in localStorage
          if (userData.user_role) {
            localStorage.setItem('user_role', userData.user_role);
            console.log('User role stored in localStorage:', userData.user_role);
          } else {
            console.warn('No user_role found in userData');
          }
          
          // Start auto-refresh system
          tokenRefreshManager.startAutoRefresh();
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          tokenManager.clearTokens();
          tokenRefreshManager.stopAutoRefresh();
        }
      } else if (token && tokenManager.getRefreshToken()) {
        // Token is expired but we have refresh token, try to refresh
        try {
          await tokenRefreshManager.performRefresh();
          const userData = await authAPI.me();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          // Store user role in localStorage
          if (userData.user_role) {
            localStorage.setItem('user_role', userData.user_role);
          }
          tokenRefreshManager.startAutoRefresh();
        } catch (error) {
          console.error('Failed to refresh token on startup:', error);
          tokenManager.clearTokens();
        }
      } else {
        // Check if user data exists in localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            // Also ensure user_role is stored in localStorage when loading from saved user
            if (parsedUser.user_role) {
              localStorage.setItem('user_role', parsedUser.user_role);
            }
          } catch (error) {
            console.error('Failed to parse saved user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('user_role');
          }
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth events
    const handleTokenRefreshed = () => {
    };

    const handleAuthError = () => {
      setUser(null);
      tokenRefreshManager.stopAutoRefresh();
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('authError', handleAuthError);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('authError', handleAuthError);
      tokenRefreshManager.stopAutoRefresh();
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Login and get tokens
      const loginResponse = await authAPI.login(credentials);
      tokenManager.setTokens(
        loginResponse.access_token, 
        loginResponse.refresh_token, 
        loginResponse.expires_in
      );
      
      // Get user data
      const userData = await authAPI.me();
      console.log('Login - User data received:', userData);
      console.log('Login - User role:', userData.user_role);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Store user role in localStorage
      if (userData.user_role) {
        localStorage.setItem('user_role', userData.user_role);
        console.log('Login - User role stored in localStorage:', userData.user_role);
      } else {
        console.warn('Login - No user_role found in userData');
      }
      
      // Start auto-refresh system
      tokenRefreshManager.startAutoRefresh();
      
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
      
      // Stop auto-refresh system
      tokenRefreshManager.stopAutoRefresh();
      
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
      // Store user role in localStorage
      if (userData.user_role) {
        localStorage.setItem('user_role', userData.user_role);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, logout the user
      await logout();
    }
  };

  const uploadProfile = async (file: File): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await authAPI.uploadProfile(file);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Store user role in localStorage
      if (userData.user_role) {
        localStorage.setItem('user_role', userData.user_role);
      }
    } catch (error: any) {
      console.error('Profile upload failed:', error);
      
      let errorMessage = 'Failed to upload profile picture. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await authAPI.removeProfile();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Store user role in localStorage
      if (userData.user_role) {
        localStorage.setItem('user_role', userData.user_role);
      }
    } catch (error: any) {
      console.error('Profile removal failed:', error);
      
      let errorMessage = 'Failed to remove profile picture. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenTimeRemaining = (): string => {
    const timeRemaining = tokenManager.getTimeUntilExpiration();
    if (timeRemaining > 0) {
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
    return 'Expired';
  };

  const getUserRole = (): string | null => {
    return user?.user_role || null;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    uploadProfile,
    removeProfile,
    getTokenTimeRemaining,
    getUserRole,
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