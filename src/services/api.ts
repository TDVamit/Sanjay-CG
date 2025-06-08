import axios from 'axios';

// Environment-based API configuration
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? 'http://3.7.151.6/api/v1'  // Direct backend URL for development
  : '/api/v1';                  // Proxy URL for production

// Types for API requests and responses
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export interface RegisterResponse {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
  username: string;
}

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  response: string;
  model_used: string;
}

export interface ResumeAnalysisRequest {
  file: File;
}

export interface ResumeAnalysisResponse {
  Category: string[];
  Score: number[];
  Comments: string[];
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await authAPI.refresh({ refresh_token: refreshToken });
          tokenManager.setTokens(response.access_token, response.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  
  refresh: async (data: RefreshRequest): Promise<RefreshResponse> => {
    const refreshUrl = isDevelopment 
      ? 'http://3.7.151.6/api/v1/auth/refresh'  // Direct backend URL for development
      : '/api/v1/auth/refresh';                  // Proxy URL for production
    
    const response = await axios.post(refreshUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    });
    return response.data;
  },
  
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  me: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

export const chatAPI = {
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post('/documents/chat', data);
    return response.data;
  }
};

export const resumeAPI = {
  analyzeResume: async (file: File): Promise<ResumeAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/documents/analyze-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default apiClient; 