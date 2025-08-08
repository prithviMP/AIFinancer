import { api } from '@/lib/apiClient';

// Types
export interface DocumentStats {
  total_documents: number;
  processed_today: number;
  total_value: number;
  processing_success_rate: number;
  documents_by_type: Record<string, number>;
  daily_processing: Array<{
    date: string;
    count: number;
  }>;
}

export interface ProcessingQueue {
  id: string;
  filename: string;
  status: string;
  progress: number;
  type: string;
}

export interface ReportParams {
  report_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReportResponse {
  report_type: string;
  period: {
    from?: string;
    to?: string;
  };
  total_documents?: number;
  by_status?: Record<string, number>;
  by_type?: Record<string, number>;
  total_value?: number;
  total_invoices?: number;
  total_receipts?: number;
  average_value?: number;
  total_processed?: number;
  success_rate?: number;
  average_processing_time?: number;
  successful_processing?: number;
  failed_processing?: number;
}

export interface TrendData {
  period: string;
  trends: Record<string, number>;
  total_documents: number;
}

export interface PerformanceMetrics {
  average_processing_time: number;
  min_processing_time: number;
  max_processing_time: number;
  total_processed_recently: number;
  system_health: string;
}

export interface AnalyticsRepository {
  getDashboardStats(): Promise<DocumentStats>;
  getProcessingQueue(): Promise<ProcessingQueue[]>;
  getReports(params: ReportParams): Promise<ReportResponse>;
  getTrends(period: string): Promise<TrendData>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
}

// Implementation
export class AnalyticsRepositoryImpl implements AnalyticsRepository {
  async getDashboardStats(): Promise<DocumentStats> {
    try {
      const response = await api.getDashboardStats();
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  async getProcessingQueue(): Promise<ProcessingQueue[]> {
    try {
      const response = await api.getProcessingQueue();
      return response.data;
    } catch (error) {
      console.error('Error fetching processing queue:', error);
      throw new Error('Failed to fetch processing queue');
    }
  }

  async getReports(params: ReportParams = {}): Promise<ReportResponse> {
    try {
      const response = await api.getReports(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }
  }

  async getTrends(period: string = '30d'): Promise<TrendData> {
    try {
      const response = await api.getTrends(period);
      return response.data;
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw new Error('Failed to fetch trends');
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await api.getPerformanceMetrics();
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }
}

// Export singleton instance
export const analyticsRepository = new AnalyticsRepositoryImpl();
