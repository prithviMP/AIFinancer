import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCards from "@/components/StatsCards";
import UploadZone from "@/components/UploadZone";
import QuickActions from "@/components/QuickActions";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ChatWidget from "@/components/ChatWidget";
import { useDashboardStore } from "@/store/dashboardStore";
import type { DocumentStats, ProcessingQueue } from "@shared/schema";

export default function Dashboard() {
  const { setStats, setProcessingQueue, setLoading, setError } = useDashboardStore();

  const { data: stats, isLoading: statsLoading } = useQuery<DocumentStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: queue, isLoading: queueLoading } = useQuery<ProcessingQueue[]>({
    queryKey: ['/api/documents/queue'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    setLoading(statsLoading || queueLoading);
    if (stats) setStats(stats);
    if (queue) setProcessingQueue(queue);
  }, [stats, queue, statsLoading, queueLoading, setStats, setProcessingQueue, setLoading]);

  return (
    <div className="bg-gray-50 dark:bg-dark-900 min-h-screen transition-colors duration-300">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      <div 
        id="sidebar-overlay" 
        className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm opacity-0 invisible transition-all duration-300"
      />
      
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <Header />
        
        <main className="p-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <UploadZone />
            </div>
            <QuickActions />
          </div>
          
          <AnalyticsDashboard />
        </main>
      </div>
      
      <ChatWidget />
    </div>
  );
}
