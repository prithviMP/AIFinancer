import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Layout } from '@/components/Layout';
import { LoadingOverlay } from '@/components/business/LoadingOverlay';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentCard } from '@/components/business/DocumentCard';
import { FileUpload } from '@/components/business/FileUpload';

export default function UploadPage() {
  const { data: documents = [], isLoading, error } = useDocuments();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });
      
      return apiRequest('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: 'Upload successful',
        description: 'Documents have been uploaded and are being processed',
      });
      setUploadingFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload documents',
        variant: 'destructive',
      });
      setUploadingFiles([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been successfully removed',
      });
    },
  });

  const handleUpload = (files: File[]) => {
    setUploadingFiles(files);
    uploadMutation.mutate(files);
  };

  const handleView = (doc: DocumentType) => {
    console.log('Viewing document:', doc);
  };

  const handleDownload = async (doc: DocumentType) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = (doc: DocumentType) => {
    if (window.confirm(`Are you sure you want to delete "${doc.originalName}"?`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-destructive mb-6">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading upload page: {error.message}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload financial documents for AI-powered analysis and data extraction
          </p>
        </div>

        {/* Upload section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={handleUpload}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
              acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
              disabled={uploadMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Recent uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Uploads ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingOverlay isLoading={isLoading} loadingText="Loading documents...">
              {documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents uploaded yet"
                  description="Upload your first document to get started with AI-powered analysis"
                  action={{
                    label: "Upload Document",
                    onClick: () => (window.document.querySelector('input[type="file"]') as HTMLInputElement)?.click(),
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </LoadingOverlay>
          </CardContent>
        </Card>

        {/* Upload stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Uploaded</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.status === 'processing').length}
                  </p>
                </div>
                <div className="h-8 w-8 text-yellow-600">⚡</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.status === 'completed').length}
                  </p>
                </div>
                <div className="h-8 w-8 text-green-600">✅</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}