import { useState } from 'react';
import { useDocuments, useDeleteDocument, useDownloadDocument } from '@/hooks/useDocuments';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Trash2, Eye, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentCard } from '@/components/business/DocumentCard';
import { LoadingOverlay } from '@/components/business/LoadingOverlay';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    document_type: '',
    search: '',
  });

  const { data: documents, isLoading, error } = useDocuments(filters);
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteMutation.mutateAsync(documentId);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const blob = await downloadMutation.mutateAsync(documentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleView = (document: any) => {
    // TODO: Implement document viewer
    console.log('Viewing document:', document);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value, page: 1 }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({ ...prev, document_type: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-destructive mb-6">
          <span>Error loading documents: {error.message}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground">
              Manage and view your uploaded documents
            </p>
          </div>
          <Button onClick={() => window.location.href = '/upload'}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.document_type} onValueChange={handleTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="financial_statement">Financial Statement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {documents?.total || 0} documents
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({documents?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingOverlay isLoading={isLoading} loadingText="Loading documents...">
              {!documents?.items?.length ? (
                <EmptyState
                  icon={FileText}
                  title="No documents found"
                  description="Upload your first document to get started"
                  action={{
                    label: "Upload Document",
                    onClick: () => window.location.href = '/upload',
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {documents.items.map((document) => (
                      <DocumentCard
                        key={document.id}
                        document={document}
                        onView={() => handleView(document)}
                        onDownload={() => handleDownload(document.id)}
                        onDelete={() => handleDelete(document.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {documents.pages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={filters.page <= 1}
                          onClick={() => handlePageChange(filters.page - 1)}
                        >
                          Previous
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          Page {filters.page} of {documents.pages}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={filters.page >= documents.pages}
                          onClick={() => handlePageChange(filters.page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </LoadingOverlay>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
