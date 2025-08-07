import { Search, BarChart, Download, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  const quickActions = [
    {
      icon: Search,
      label: "Query Documents",
      description: "Search and ask questions about your documents",
      onClick: () => console.log("Query documents clicked"),
      primary: true,
    },
    {
      icon: BarChart,
      label: "Generate Report",
      description: "Create comprehensive financial reports",
      onClick: () => console.log("Generate report clicked"),
      primary: false,
    },
    {
      icon: Download,
      label: "Export Data",
      description: "Download processed data and insights",
      onClick: () => console.log("Export data clicked"),
      primary: false,
    },
  ];

  const recentActivities = [
    {
      type: "success",
      title: "Invoice processed",
      description: "Invoice #INV-2024-001 - $2,450",
      time: "2 minutes ago",
      color: "bg-green-500",
    },
    {
      type: "info",
      title: "New query answered",
      description: '"What are the total expenses for Q4?"',
      time: "5 minutes ago",
      color: "bg-blue-500",
    },
    {
      type: "primary",
      title: "Contract extracted",
      description: "Service Agreement - Terms identified",
      time: "10 minutes ago",
      color: "bg-primary-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.primary ? "default" : "ghost"}
                className={`w-full flex items-center justify-between p-3 h-auto ${
                  action.primary 
                    ? "bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800" 
                    : "bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600"
                }`}
                onClick={action.onClick}
              >
                <div className="flex items-center text-left">
                  <action.icon className={action.primary ? "text-primary-600" : "text-gray-600 dark:text-gray-400"} size={18} />
                  <div className="ml-3">
                    <div className={`font-medium ${action.primary ? "text-primary-700 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {action.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {action.description}
                    </div>
                  </div>
                </div>
                <ArrowRight className={action.primary ? "text-primary-600" : "text-gray-600 dark:text-gray-400"} size={16} />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
