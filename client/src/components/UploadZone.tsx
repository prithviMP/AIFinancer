import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, File, FileImage, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDashboardStore } from "@/store/dashboardStore";
import type { ProcessingQueue } from "@shared/schema";

interface UploadFile extends File {
  progress?: number;
  status?: 'uploading' | 'processing' | 'completed' | 'error';
  id?: string;
}

export default function UploadZone() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processingQueue } = useDashboardStore();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: (data, file) => {
      setFiles(prev => prev.map(f => 
        f === file ? { ...f, status: 'processing', id: data.id } : f
      ));
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/queue'] });
      toast({
        title: "Upload successful",
        description: "Your document is being processed.",
      });
    },
    onError: (error, file) => {
      setFiles(prev => prev.map(f => 
        f === file ? { ...f, status: 'error' } : f
      ));
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Please upload PDF, JPG, or PNG files.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    const uploadFiles = validFiles.map(file => ({
      ...file,
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadFiles]);

    // Upload files
    validFiles.forEach(file => {
      uploadMutation.mutate(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <File className="text-red-500" size={16} />;
    if (type.includes('image')) return <FileImage className="text-blue-500" size={16} />;
    return <File className="text-gray-500" size={16} />;
  };

  const getProgressValue = (file: UploadFile) => {
    if (file.status === 'uploading') return file.progress || 0;
    if (file.status === 'processing') return 75;
    if (file.status === 'completed') return 100;
    return 0;
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Preparing...';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upload Documents</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-primary-600 hover:text-primary-700"
        >
          Browse Files
        </Button>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10' 
              : 'border-gray-300 dark:border-dark-600 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="group-hover:scale-105 transition-transform">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CloudUpload className="text-primary-600" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Drop files here</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">or click to browse and upload</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>PDF</span>
              <span>•</span>
              <span>JPG</span>
              <span>•</span>
              <span>PNG</span>
              <span>•</span>
              <span>Max 10MB</span>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
          className="hidden"
        />

        {/* Upload Progress */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload Progress</h3>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center flex-1">
                    {getFileIcon(file.type)}
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-xs text-gray-500">{getStatusText(file)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 mr-3">
                      <Progress value={getProgressValue(file)} className="h-2" />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{getProgressValue(file)}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Queue */}
        {processingQueue.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Processing Queue</h3>
            <div className="space-y-3">
              {processingQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center">
                    {getFileIcon(item.type)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.filename}</p>
                      <p className="text-xs text-gray-500">{item.status}...</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 mr-3">
                      <Progress value={item.progress} className="h-2" />
                    </div>
                    <span className="text-xs text-gray-500">{item.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
