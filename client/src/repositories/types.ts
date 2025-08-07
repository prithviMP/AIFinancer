// API response types and interfaces
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// API client configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

// Request options
export interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}