import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStore } from "@/store/dashboardStore";

export default function AnalyticsDashboard() {
  const { stats } = useDashboardStore();

  const chartData = stats?.dailyProcessing || [];
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  
  const documentTypes = [
    { label: "Invoices", count: stats?.documentsByType.invoices || 0, percentage: 57, color: "bg-primary-600" },
    { label: "Contracts", count: stats?.documentsByType.contracts || 0, percentage: 28, color: "bg-primary-800" },
    { label: "Receipts", count: stats?.documentsByType.receipts || 0, percentage: 10, color: "bg-primary-300" },
    { label: "Others", count: stats?.documentsByType.others || 0, percentage: 5, color: "bg-gray-400" },
  ];

  const totalDocs = documentTypes.reduce((sum, type) => sum + type.count, 0);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Document Processing Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Document Processing</CardTitle>
          <Select defaultValue="7days">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="chart-container rounded-xl p-4">
            <div className="h-48 flex items-end justify-between space-x-2">
              {chartData.slice(-7).map((data, index) => {
                const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                const dayName = dayNames[index] || 'Day';
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-primary-600 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`${dayName}: ${data.count} documents`}
                    />
                    <span className="text-xs text-gray-500 mt-2">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle>Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documentTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 ${type.color} rounded-full mr-3`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{type.count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({totalDocs > 0 ? Math.round((type.count / totalDocs) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Circular Progress Visualization */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle 
                  cx="64" 
                  cy="64" 
                  r="48" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  className="text-gray-200 dark:text-dark-600"
                />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="48" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="301.6" 
                  strokeDashoffset={totalDocs > 0 ? 301.6 - (totalDocs / 300) * 301.6 : 301.6}
                  className="text-primary-600" 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">{totalDocs}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
