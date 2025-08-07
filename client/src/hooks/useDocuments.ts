import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentRepository, type DocumentListOptions, type DocumentUploadData } from "@/repositories";
import { useToast } from "@/hooks/use-toast";

export function useDocuments(options: DocumentListOptions = {}) {
  return useQuery({
    queryKey: ['/api/documents', options],
    queryFn: () => documentRepository.getDocuments(options),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['/api/documents', id],
    queryFn: () => documentRepository.getDocument(id),
    enabled: !!id,
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => documentRepository.getDocumentStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useProcessingQueue() {
  return useQuery({
    queryKey: ['/api/documents/queue'],
    queryFn: () => documentRepository.getProcessingQueue(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: DocumentUploadData) => documentRepository.uploadDocument(data),
    onSuccess: (document) => {
      toast({
        title: "Upload successful",
        description: `${document.originalName} has been uploaded and is being processed.`,
      });

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/queue'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => documentRepository.deleteDocument(id),
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted.",
      });

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDownloadDocument() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await documentRepository.downloadDocument(id);
      return blob;
    },
    onError: (error: any) => {
      toast({
        title: "Download failed", 
        description: error.message || "Failed to download document. Please try again.",
        variant: "destructive",
      });
    },
  });
}