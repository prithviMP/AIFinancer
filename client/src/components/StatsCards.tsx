import { FileText, CheckCircle, DollarSign, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStore } from "@/store/dashboardStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsCards() {
  const { stats, isLoading } = useDashboardStore();

  const statCards = [
    {
      title: "Total Documents",
      value: stats?.totalDocuments?.toString() || "0",
      change: "+12%",
      changeText: "vs last month",
      icon: FileText,
      iconBg: "bg-primary-300/20",
      iconColor: "text-primary-800",
    },
    {
      title: "Processed Today",
      value: stats?.processedToday?.toString() || "0",
      change: "+8%",
      changeText: "vs yesterday",
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Total Value",
      value: stats?.totalValue || "$0",
      change: "+15%",
      changeText: "vs last quarter",
      icon: DollarSign,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "AI Accuracy",
      value: stats?.accuracy || "0%",
      change: "+2%",
      changeText: "improvement",
      icon: Brain,
      iconBg: "bg-primary-300/20",
      iconColor: "text-primary-800",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
              <div className="flex items-center mt-4 space-x-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon className={card.iconColor} size={20} />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className="text-green-500 text-sm font-medium">{card.change}</span>
              <span className="text-gray-500 text-sm ml-1">{card.changeText}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
