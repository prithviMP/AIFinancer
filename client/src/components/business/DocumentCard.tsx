import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Download, Eye, Trash2, MoreVertical, Calendar } from "lucide-react";
import { Document } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  className?: string;
}

export function DocumentCard({ 
  document, 
  onView, 
  onDownload, 
  onDelete,
  className 
}: DocumentCardProps) {
  const getDocumentTypeIcon = () => {
    if (document.mimeType.includes('pdf')) return '📄';
    if (document.mimeType.includes('image')) return '🖼️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getDocumentTypeIcon()}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate" title={document.originalName}>
                {document.originalName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={document.status as any} size="sm" />
                {document.documentType && (
                  <Badge variant="outline" className="text-xs">
                    {document.documentType}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(document)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              {onDownload && document.status === 'completed' && (
                <DropdownMenuItem onClick={() => onDownload(document)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(document)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* File info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Size:</span>
              <span className="ml-2 font-medium">{formatFileSize(document.size)}</span>
            </div>
            {document.totalValue && (
              <div>
                <span className="text-muted-foreground">Value:</span>
                <span className="ml-2 font-medium text-green-600">
                  {formatCurrency(document.totalValue)}
                </span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Uploaded {formatDistanceToNow(new Date(document.uploadedAt))} ago</span>
            </div>
          </div>

          {/* Processing info */}
          {document.processedAt && (
            <div className="text-sm text-muted-foreground">
              Processed {formatDistanceToNow(new Date(document.processedAt))} ago
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(document)}>
                <Eye className="mr-1.5 h-3 w-3" />
                View
              </Button>
            )}
            {onDownload && document.status === 'completed' && (
              <Button variant="outline" size="sm" onClick={() => onDownload(document)}>
                <Download className="mr-1.5 h-3 w-3" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}