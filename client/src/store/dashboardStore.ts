import { create } from 'zustand';
import type { DocumentStats, ProcessingQueue } from '@shared/schema';

interface DashboardState {
  stats: DocumentStats | null;
  processingQueue: ProcessingQueue[];
  isLoading: boolean;
  error: string | null;
  setStats: (stats: DocumentStats) => void;
  setProcessingQueue: (queue: ProcessingQueue[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  processingQueue: [],
  isLoading: false,
  error: null,
  setStats: (stats) => set({ stats }),
  setProcessingQueue: (processingQueue) => set({ processingQueue }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
