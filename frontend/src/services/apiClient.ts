// HTTP client setup
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  _retry?: boolean;
};

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async refreshAccessToken(): Promise<void> {
    const refreshToken = localStorage.getItem('enfor_refresh_token');
    if (!refreshToken) {
      throw new Error('Session expired. Please login again.');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      throw new Error('Session refresh failed');
    }

    if (data.data?.token) {
      localStorage.setItem('enfor_token', data.data.token);
    }
    if (data.data?.refresh_token) {
      localStorage.setItem('enfor_refresh_token', data.data.refresh_token);
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (!options.skipAuth) {
      const token = localStorage.getItem('enfor_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      let response = await fetch(url, config);
      let data: any;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401 && !options._retry) {
          await this.refreshAccessToken();
          return this.request<T>(endpoint, {
            ...options,
            _retry: true,
          });
        }

        let errorMessage = data?.error || 'Request failed';
        if (data?.message) {
          errorMessage = `${errorMessage}: ${data.message}`;
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // File upload requires special handling for FormData (no Content-Type header)
  public async upload(endpoint: string, file: File, fieldName: string, retry = false): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const formData = new FormData();
    formData.append(fieldName, file);

    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {},
    };

    const token = localStorage.getItem('enfor_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 && !retry) {
          await this.refreshAccessToken();
          return this.upload(endpoint, file, fieldName, true);
        }
        throw new Error(data.error || 'Upload failed');
      }
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    apiClient.request<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiClient.request<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  put: <T>(endpoint: string, data?: any, options?: RequestOptions) => 
    apiClient.request<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    apiClient.request<T>(endpoint, { ...options, method: 'DELETE' }),
  
  upload: (endpoint: string, file: File, fieldName: string = 'file') =>
    apiClient.upload(endpoint, file, fieldName),
};

// Default export for convenience
export default api;
