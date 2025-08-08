import { useState } from 'react';
import { useDashboardStats, useTrends, usePerformanceMetrics } from '@/hooks/useAnalytics';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Activity, Download, Calendar } from 'lucide-react';
import { LoadingOverlay } from '@/components/business/LoadingOverlay';
import { EmptyState } from '@/components/ui/empty-state';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useTrends(period);
  const { data: performance, isLoading: performanceLoading } = usePerformanceMetrics();

  const isLoading = statsLoading || trendsLoading || performanceLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert from cents
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingOverlay isLoading={true} loadingText="Loading analytics..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              Insights and performance metrics for your documents
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold">{stats?.total_documents || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processed Today</p>
                  <p className="text-2xl font-bold">{stats?.processed_today || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    {stats?.total_value ? formatCurrency(stats.total_value) : '$0.00'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats?.processing_success_rate?.toFixed(1) || 0}%</p>
                </div>
                <div className="h-8 w-8 text-green-600">✓</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and detailed analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document types distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Document Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.documents_by_type ? (
                <div className="space-y-3">
                  {Object.entries(stats.documents_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No data available"
                  description="Upload documents to see type distribution"
                />
              )}
            </CardContent>
          </Card>

          {/* Processing trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Processing Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends?.trends ? (
                <div className="space-y-3">
                  {Object.entries(trends.trends).slice(-7).map(([date, count]) => (
                    <div key={date} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{date}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="No trend data"
                  description="Processing trends will appear here"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                  <p className="text-2xl font-bold">
                    {performance.average_processing_time?.toFixed(1) || 0}s
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Min Processing Time</p>
                  <p className="text-2xl font-bold">
                    {performance.min_processing_time?.toFixed(1) || 0}s
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Max Processing Time</p>
                  <p className="text-2xl font-bold">
                    {performance.max_processing_time?.toFixed(1) || 0}s
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">System Health</p>
                  <p className={`text-2xl font-bold ${getStatusColor(performance.system_health)}`}>
                    {performance.system_health || 'Unknown'}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No performance data"
                description="Performance metrics will appear here"
              />
            )}
          </CardContent>
        </Card>

        {/* Daily processing chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Processing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.daily_processing?.length ? (
              <div className="space-y-3">
                {stats.daily_processing.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min((day.count / Math.max(...stats.daily_processing.map(d => d.count))) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <Badge variant="outline">{day.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No daily data"
                description="Daily processing data will appear here"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
