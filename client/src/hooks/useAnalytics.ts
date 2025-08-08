import { useQuery } from "@tanstack/react-query";
import { analyticsRepository, type ReportParams } from "@/repositories/analyticsRepository";

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsRepository.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useProcessingQueue() {
  return useQuery({
    queryKey: ['analytics', 'queue'],
    queryFn: () => analyticsRepository.getProcessingQueue(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useReports(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'reports', params],
    queryFn: () => analyticsRepository.getReports(params),
    staleTime: 60000, // 1 minute
  });
}

export function useTrends(period: string = '30d') {
  return useQuery({
    queryKey: ['analytics', 'trends', period],
    queryFn: () => analyticsRepository.getTrends(period),
    staleTime: 300000, // 5 minutes
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: () => analyticsRepository.getPerformanceMetrics(),
    refetchInterval: 60000, // Refresh every minute
  });
}
