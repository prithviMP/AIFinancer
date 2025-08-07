import { StatsCard } from "@/components/business/StatsCard";
import { ProcessingQueue } from "@/components/business/ProcessingQueue";
import { DocumentCard } from "@/components/business/DocumentCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useDocumentStats, useDocuments, useDeleteDocument, useDownloadDocument } from "@/hooks/useDocuments";
import { Link } from "wouter";
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Upload,
  AlertCircle
} from "lucide-react";
import { Document as DocumentType } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDocumentStats();
  const { data: documents = [], isLoading: documentsLoading, error: documentsError } = useDocuments();
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  const handleView = (doc: DocumentType) => {
    // TODO: Implement document viewer modal
    console.log('View document:', doc);
  };

  const handleDownload = async (doc: DocumentType) => {
    try {
      const blob = await downloadMutation.mutateAsync(doc.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
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

  if (statsError || documentsError) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-destructive mb-6">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading dashboard</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Financial Document Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered document analysis and insights at your fingertips
          </p>
        </div>

        {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              <>
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
              </>
            ) : (
              <>
                <StatsCard
                  title="Total Documents"
                  value={stats?.totalDocuments ?? 0}
                  icon={FileText}
                  description="All uploaded documents"
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/10 border-blue-200 dark:border-blue-800/30"
                />
                <StatsCard
                  title="Processed Today"
                  value={stats?.processedToday ?? 0}
                  icon={TrendingUp}
                  description="Documents processed today"
                  trend={{ value: 12, isPositive: true }}
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 border-green-200 dark:border-green-800/30"
                />
                <StatsCard
                  title="Total Value"
                  value={`$${(stats?.totalValue ?? 0).toLocaleString()}`}
                  icon={DollarSign}
                  description="Sum of all document values"
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 border-purple-200 dark:border-purple-800/30"
                />
                <StatsCard
                  title="Processing Rate"
                  value={`${stats?.processingSuccessRate ?? 0}%`}
                  icon={BarChart3}
                  description="Success rate"
                  trend={{ value: 8, isPositive: false }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30"
                />
              </>
            )}
          </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Documents */}
          <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Documents
                  </CardTitle>
                  <Link to="/upload">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : documents.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No documents yet"
                      description="Upload your first document to get started with AI-powered analysis"
                      action={{
                        label: "Upload Document",
                        onClick: () => window.location.href = "/upload"
                      }}
                    />
                  ) : (
                    <div className="space-y-4">
                      {documents.slice(0, 5).map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onView={() => handleView(doc)}
                          onDownload={() => handleDownload(doc)}
                          onDelete={() => handleDelete(doc)}
                        />
                      ))}
                      {documents.length > 5 && (
                        <div className="text-center pt-4">
                          <Link to="/upload">
                            <Button variant="outline" size="sm">
                              View All Documents
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
            </Card>
          </div>

          {/* Processing Queue */}
          <div>
            <ProcessingQueue />
          </div>
        </div>
      </div>
    </Layout>
  );
}
