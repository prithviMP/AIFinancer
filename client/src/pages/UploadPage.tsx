import { useState } from 'react';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDocuments, useUploadDocument, useDeleteDocument, useDownloadDocument } from '@/hooks/useDocuments';
import { DocumentType } from '@shared/schema';
import { Layout } from '@/components/Layout';
import { LoadingOverlay } from '@/components/business/LoadingOverlay';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentCard } from '@/components/business/DocumentCard';
import { FileUpload } from '@/components/business/FileUpload';

export default function UploadPage() {
  const { data: documents = [], isLoading, error } = useDocuments();
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // Normalize to a plain array for rendering and counters
  const documentItems: DocumentType[] = Array.isArray(documents)
    ? (documents as DocumentType[])
    : (documents?.items ?? []);

  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  const handleUpload = async (files: File[]) => {
    setUploadingFiles(files);
    try {
      await uploadMutation.mutateAsync(files);
      toast({ title: 'Upload successful', description: 'Documents have been uploaded and are being processed' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Failed to upload documents', variant: 'destructive' });
      throw e; // allow caller to handle upload flow
    } finally {
      setUploadingFiles([]);
    }
  };

  const handleView = async (doc: DocumentType) => {
    // Reuse download flow to open the file in a new tab
    try {
      const blob = await downloadMutation.mutateAsync(doc.id);
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      }
    } catch (error) {
      console.error('View error:', error);
    }
  };

  const handleDownload = async (doc: DocumentType) => {
    try {
      const blob = await downloadMutation.mutateAsync(doc.id);
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
              Recent Uploads ({documentItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingOverlay isLoading={isLoading || uploadMutation.isPending} loadingText="Loading documents...">
              {documentItems.length === 0 ? (
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
                  {documentItems.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onView={() => handleView(document)}
                      onDownload={() => handleDownload(document)}
                      onDelete={() => handleDelete(document.id)}
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
                  <p className="text-2xl font-bold">{documentItems.length}</p>
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
                    {documentItems.filter(d => d.status === 'processing').length}
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
                    {documentItems.filter(d => d.status === 'completed').length}
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