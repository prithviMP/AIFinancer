import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "processing" | "completed" | "failed" | "active" | "inactive";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    className: "text-yellow-700 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800",
  },
  processing: {
    label: "Processing",
    variant: "default" as const,
    icon: Loader2,
    className: "text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800",
    iconProps: { className: "animate-spin" },
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle,
    className: "text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
    className: "text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800",
  },
  active: {
    label: "Active",
    variant: "default" as const,
    icon: CheckCircle,
    className: "text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800",
  },
  inactive: {
    label: "Inactive",
    variant: "secondary" as const,
    icon: XCircle,
    className: "text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800",
  },
};

export function StatusBadge({ status, size = "md", showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const iconProps = (config as any).iconProps || {};

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon 
          size={iconSizes[size]} 
          {...iconProps}
        />
      )}
      {config.label}
    </Badge>
  );
}