import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentRepository, type DocumentListParams } from "@/repositories/documentRepository";
import { useToast } from "@/hooks/use-toast";

export function useDocuments(params: DocumentListParams = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentRepository.getDocuments(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentRepository.getDocument(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (files: File[]) => 
      Promise.all(files.map(file => documentRepository.uploadDocument(file))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: "Upload successful",
        description: "Documents have been uploaded and are being processed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents",
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
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: "Document deleted",
        description: "The document has been successfully removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
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
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    },
  });
}

export function useQueryDocuments() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ query, documentIds }: { query: string; documentIds?: string[] }) =>
      documentRepository.queryDocuments(query, documentIds),
    onError: (error: any) => {
      toast({
        title: "Query failed",
        description: error.message || "Failed to process query",
        variant: "destructive",
      });
    },
  });
}