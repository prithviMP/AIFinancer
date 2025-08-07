import { ApiConfig, ApiError, RequestOptions } from './types';

class ApiClient {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: window.location.origin,
      timeout: 10000,
      retries: 3,
      ...config,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const { params, headers = {}, timeout = this.config.timeout, ...fetchOptions } = options;
    
    // Build URL with query parameters
    const url = new URL(endpoint, this.config.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Setup request configuration
    const requestConfig: RequestInit = {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add timeout support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        const apiError: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
        };

        throw apiError;
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) return {} as T;

      try {
        return JSON.parse(text);
      } catch {
        return text as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload files with form data
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const { headers = {}, ...restOptions } = options || {};
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    const uploadHeaders = { ...headers };
    delete uploadHeaders['Content-Type'];

    return this.request<T>(endpoint, {
      ...restOptions,
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;