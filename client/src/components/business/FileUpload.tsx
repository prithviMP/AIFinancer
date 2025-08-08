import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadFile extends File {
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

export function FileUpload({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
  disabled = false,
}: FileUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => {
      const uploadFile = file as UploadFile; // preserve File prototype
      uploadFile.id = Math.random().toString(36).substr(2, 9);
      uploadFile.status = 'pending';
      uploadFile.progress = 0;
      return uploadFile;
    });

    setUploadFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    disabled: disabled || isUploading,
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Update files to uploading status
      setUploadFiles(prev => 
        prev.map(f => ({ ...f, status: 'uploading', progress: 0 }))
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => 
          prev.map(f => 
            f.status === 'uploading' 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Perform actual upload using the original File instances
      const files = uploadFiles.map(f => f as File);
      await onUpload(files);

      clearInterval(progressInterval);

      // Mark as completed
      setUploadFiles(prev => 
        prev.map(f => ({ ...f, status: 'completed', progress: 100 }))
      );

      // Clear files after a delay
      setTimeout(() => {
        setUploadFiles([]);
      }, 2000);

    } catch (error) {
      setUploadFiles(prev => 
        prev.map(f => ({ 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = (typeof bytes === 'number' && isFinite(bytes) && bytes >= 0) ? bytes : 0;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (file: UploadFile) => {
    const type = file?.type || "";
    const lower = type.toLowerCase();
    if (lower.includes('pdf')) return '📄';
    if (lower.includes('image')) return '🖼️';
    return '📎';
  };

  const canUpload = uploadFiles.length > 0 && !isUploading && 
    uploadFiles.every(f => f.status === 'pending');

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <Card className={cn(
        "border-2 border-dashed transition-colors cursor-pointer",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <CardContent className="p-6">
          <div {...getRootProps()} className="text-center">
            <input {...getInputProps()} />
            <Upload className={cn(
              "mx-auto h-12 w-12 mb-4",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
            
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? "Drop files here" : "Upload Documents"}
            </h3>
            
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {acceptedTypes.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.split('/')[1].toUpperCase()}
                </Badge>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <div className="text-sm text-destructive">
          {fileRejections.map((rejection) => (
            <div key={rejection.file.name} className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{rejection.file.name}: {rejection.errors[0]?.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Files to upload ({uploadFiles.length})</h4>
            {canUpload && (
              <Button onClick={handleUpload} size="sm">
                <Upload className="mr-1.5 h-3 w-3" />
                Upload All
              </Button>
            )}
          </div>

          {uploadFiles.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="text-lg">{getFileIcon(file)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {file.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      {file.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    {file.status === 'error' && file.error && (
                      <span className="text-destructive">{file.error}</span>
                    )}
                  </div>
                  
                  {(file.status === 'uploading' || file.status === 'completed') && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}