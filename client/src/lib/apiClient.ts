import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API client configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add auth token if available (for future use)
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login if needed
      console.error('Unauthorized access');
    } else if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API methods
export const api = {
  // Documents
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getDocuments: (params: {
    page?: number;
    limit?: number;
    status?: string;
    document_type?: string;
    search?: string;
  }) => apiClient.get('/documents', { params }),

  getDocument: (id: string) => apiClient.get(`/documents/${id}`),

  deleteDocument: (id: string) => apiClient.delete(`/documents/${id}`),

  downloadDocument: (id: string) =>
    apiClient.get(`/documents/${id}/download`, { responseType: 'blob' }),

  queryDocuments: (query: string, documentIds?: string[]) =>
    apiClient.post('/documents/query', { query, document_ids: documentIds }),

  // Analytics
  getDashboardStats: () => apiClient.get('/analytics/dashboard'),

  getProcessingQueue: () => apiClient.get('/analytics/processing-queue'),

  getDocumentStats: () => apiClient.get('/analytics/document-stats'),

  getReports: (params: {
    report_type?: string;
    date_from?: string;
    date_to?: string;
  }) => apiClient.get('/analytics/reports', { params }),

  getTrends: (period: string = '30d') =>
    apiClient.get('/analytics/trends', { params: { period } }),

  getPerformanceMetrics: () => apiClient.get('/analytics/performance'),

  // Chat
  sendMessage: (message: {
    content: string;
    session_id: string;
    is_from_user: boolean;
    document_context?: any;
  }) => apiClient.post('/chat/message', message),

  getChatHistory: (sessionId?: string) =>
    apiClient.get('/chat/history', { params: { session_id: sessionId } }),

  createChatSession: () => apiClient.post('/chat/session'),

  getChatSessions: () => apiClient.get('/chat/sessions'),

  deleteChatSession: (sessionId: string) =>
    apiClient.delete(`/chat/session/${sessionId}`),

  // Health check
  healthCheck: () => apiClient.get('/health'),
};

export default apiClient;
