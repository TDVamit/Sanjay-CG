import axios from 'axios';

// Environment-based API configuration
const isDevelopment = import.meta.env.DEV;
const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL || 'http://3.7.151.6/api/v1';
const API_BASE_URL = isDevelopment 
  ? BACKEND_SERVER_URL  // Use environment variable for development
  : '/api/v1';          // Proxy URL for production

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
  user_role: string;
  user_profile?: string; // Base64 encoded image
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

// Roadmap types
export interface RoadmapRequest {
  name: string;
  roadmap: string;
  description: string;
  category_ids?: string[];
}

export interface Category {
  _id: string;
  name: string;
}

export interface RoadmapListItem {
  _id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  categories: Category[];
}

export interface RoadmapResponse {
  _id: string;
  created_at: string;
  updated_at: string;
  name: string;
  roadmap: string;
  description: string;
  categories: Category[];
}

export interface RoadmapsListResponse {
  items: RoadmapListItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface RoadmapDeleteResponse {
  message: string;
  roadmap_id: string;
  deleted_by: string;
}

// Add new category types
export interface CategoryResponse {
  _id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
}

export interface CategoryRequest {
  name: string;
  description: string;
}

export interface CategoriesListResponse {
  items: CategoryResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Add guidance agent types
export interface GuidanceAgentRequest {
  name: string;
  description: string;
  link: string;
  category_ids: string[];
  profile_pic: string;
}

export interface GuidanceAgentResponse {
  _id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  link: string;
  profile_pic: string;
  categories: Category[];
}

export interface GuidanceAgentsListResponse {
  items: GuidanceAgentResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GuidanceAgentDeleteResponse {
  message: string;
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
  
  getTokenExpiration: (): number | null => {
    const expirationStr = localStorage.getItem('token_expiration');
    return expirationStr ? parseInt(expirationStr) : null;
  },
  
  setTokens: (accessToken: string, refreshToken: string, expiresIn?: number): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Calculate and store expiration time
    if (expiresIn) {
      const expirationTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem('token_expiration', expirationTime.toString());
    }
  },
  
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
  },
  
  getUserRole: (): string | null => {
    return localStorage.getItem('user_role');
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  },
  
  getTimeUntilExpiration: (): number => {
    const expiration = tokenManager.getTokenExpiration();
    if (!expiration) return 0;
    return Math.max(0, expiration - Date.now());
  },
  
  shouldRefreshToken: (): boolean => {
    const timeUntilExpiration = tokenManager.getTimeUntilExpiration();
    // Refresh if token expires in less than 5 minutes (300,000 ms)
    return timeUntilExpiration > 0 && timeUntilExpiration < 300000;
  }
};

// Proactive token refresh system
class TokenRefreshManager {
  private refreshTimer: number | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  public startAutoRefresh(): void {
    this.scheduleNextRefresh();
  }

  public stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private scheduleNextRefresh(): void {
    this.stopAutoRefresh();
    
    const timeUntilExpiration = tokenManager.getTimeUntilExpiration();
    if (timeUntilExpiration <= 0) {
      return; // Token already expired
    }
    
    // Schedule refresh 5 minutes before expiration, but at least 1 minute from now
    const refreshTime = Math.max(60000, timeUntilExpiration - 300000);
    
    this.refreshTimer = setTimeout(async () => {
      await this.performRefresh();
      this.scheduleNextRefresh(); // Schedule next refresh
    }, refreshTime);
  }

  public async performRefresh(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise || Promise.resolve();
    }

    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      return;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh(refreshToken);
    
    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(refreshToken: string): Promise<void> {
    try {
      const response = await authAPI.refresh({ refresh_token: refreshToken });
      tokenManager.setTokens(
        response.access_token, 
        response.refresh_token, 
        response.expires_in
      );
      
      
      // Dispatch a custom event to notify components
      window.dispatchEvent(new CustomEvent('tokenRefreshed', {
        detail: { newToken: response.access_token }
      }));
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear tokens and redirect to login
      tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('authError', {
        detail: { error: 'Token refresh failed' }
      }));
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }
}

// Create global instance
export const tokenRefreshManager = new TokenRefreshManager();

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
          tokenManager.setTokens(
            response.access_token, 
            response.refresh_token, 
            response.expires_in
          );
          originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
          
          // Restart auto-refresh with new token
          tokenRefreshManager.startAutoRefresh();
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, stop auto-refresh and redirect to login
          tokenRefreshManager.stopAutoRefresh();
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
      ? `${BACKEND_SERVER_URL}/auth/refresh`  // Use environment variable for development
      : '/api/v1/auth/refresh';               // Proxy URL for production
    
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
  },

  // Upload profile picture
  uploadProfile: async (file: File): Promise<UserResponse> => {
    const formData = new FormData();
    formData.append('user_profile', file);
    
    const response = await apiClient.post('/auth/upload-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove profile picture
  removeProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.delete('/auth/remove-profile');
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

export const roadmapAPI = {
  // Get all roadmaps with pagination, search, and category filtering
  getAll: async (page: number = 1, size: number = 10, search?: string, categoryId?: string): Promise<RoadmapsListResponse> => {
    let url = `/roadmaps/?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (categoryId) {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get single roadmap by ID
  getById: async (id: string): Promise<RoadmapResponse> => {
    const response = await apiClient.get(`/roadmaps/${id}`);
    return response.data;
  },

  // Create new roadmap
  create: async (data: RoadmapRequest): Promise<RoadmapResponse> => {
    const response = await apiClient.post('/roadmaps/', data);
    return response.data;
  },

  // Update existing roadmap
  update: async (id: string, data: RoadmapRequest): Promise<RoadmapResponse> => {
    const response = await apiClient.put(`/roadmaps/${id}`, data);
    return response.data;
  },

  // Delete roadmap
  delete: async (id: string): Promise<RoadmapDeleteResponse> => {
    const response = await apiClient.delete(`/roadmaps/${id}`);
    return response.data;
  }
};

// Add category API endpoints
export const categoryAPI = {
  // Get all categories with pagination and search
  getAll: async (page: number = 1, size: number = 10, search?: string): Promise<CategoriesListResponse> => {
    let url = `/categories/?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Create new category
  create: async (data: CategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.post('/categories/', data);
    return response.data;
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, or similar prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Add guidance agent API endpoints
export const guidanceAgentAPI = {
  // Get all guidance agents with pagination, search, and category filtering
  getAll: async (page: number = 1, size: number = 10, search?: string, categoryId?: string): Promise<GuidanceAgentsListResponse> => {
    let url = `/guidance-agents/?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (categoryId) {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get single guidance agent by ID
  getById: async (id: string): Promise<GuidanceAgentResponse> => {
    const response = await apiClient.get(`/guidance-agents/${id}`);
    return response.data;
  },

  // Create new guidance agent
  create: async (data: Omit<GuidanceAgentRequest, 'profile_pic'>, profilePicFile?: File): Promise<GuidanceAgentResponse> => {
    let profile_pic = '';
    if (profilePicFile) {
      try {
        profile_pic = await fileToBase64(profilePicFile);
      } catch (error) {
        console.error('Failed to convert profile picture to base64:', error);
        throw new Error('Failed to process profile picture');
      }
    }

    const requestData: GuidanceAgentRequest = {
      ...data,
      profile_pic
    };

    const response = await apiClient.post('/guidance-agents/', requestData);
    return response.data;
  },

  // Update existing guidance agent
  update: async (id: string, data: Omit<GuidanceAgentRequest, 'profile_pic'>, profilePicFile?: File): Promise<GuidanceAgentResponse> => {
    let profile_pic = '';
    if (profilePicFile) {
      try {
        profile_pic = await fileToBase64(profilePicFile);
      } catch (error) {
        console.error('Failed to convert profile picture to base64:', error);
        throw new Error('Failed to process profile picture');
      }
    }

    const requestData: GuidanceAgentRequest = {
      ...data,
      profile_pic
    };

    const response = await apiClient.put(`/guidance-agents/${id}`, requestData);
    return response.data;
  },

  // Delete guidance agent
  delete: async (id: string): Promise<GuidanceAgentDeleteResponse> => {
    const response = await apiClient.delete(`/guidance-agents/${id}`);
    return response.data;
  }
};

export default apiClient; 