import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock, FileText } from "lucide-react";
import { useProcessingQueue } from "@/hooks/useDocuments";

export function ProcessingQueue() {
  const { data: queue = [], isLoading, error } = useProcessingQueue();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Error loading processing queue
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Processing Queue ({queue.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-2 w-3/4" />
              </div>
            ))}
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents processing"
            description="All documents have been processed"
          />
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg">{getTypeIcon(item.type)}</span>
                    <span className="font-medium truncate" title={item.filename}>
                      {item.filename}
                    </span>
                  </div>
                  <Badge 
                    className={getStatusColor(item.status)}
                    variant="secondary"
                  >
                    {item.status}
                  </Badge>
                </div>
                
                {(item.status === 'processing' || item.status === 'pending') && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-1.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}