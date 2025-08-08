import { api, PaginatedResponse } from '@/lib/apiClient';

// Types
export interface Document {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
  processed_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  document_type?: string;
  extracted_data?: any;
  ocr_text?: string;
  total_value?: number;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  status?: string;
  document_type?: string;
  search?: string;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  status: string;
  message: string;
}

export interface QueryResponse {
  query: string;
  response: string;
  context_documents: number;
  confidence?: number;
  sources?: string[];
}

export interface DocumentRepository {
  uploadDocument(file: File): Promise<DocumentUploadResponse>;
  getDocuments(params: DocumentListParams): Promise<PaginatedResponse<Document>>;
  getDocument(id: string): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  downloadDocument(id: string): Promise<Blob>;
  queryDocuments(query: string, documentIds?: string[]): Promise<QueryResponse>;
}

// Implementation
export class DocumentRepositoryImpl implements DocumentRepository {
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    try {
      const response = await api.uploadDocument(file);
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async getDocuments(params: DocumentListParams = {}): Promise<PaginatedResponse<Document>> {
    try {
      const response = await api.getDocuments(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  async getDocument(id: string): Promise<Document> {
    try {
      const response = await api.getDocument(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw new Error('Failed to fetch document');
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await api.deleteDocument(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  async downloadDocument(id: string): Promise<Blob> {
    try {
      const response = await api.downloadDocument(id);
      return response.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  async queryDocuments(query: string, documentIds?: string[]): Promise<QueryResponse> {
    try {
      const response = await api.queryDocuments(query, documentIds);
      return response.data;
    } catch (error) {
      console.error('Error querying documents:', error);
      throw new Error('Failed to query documents');
    }
  }
}

// Export singleton instance
export const documentRepository = new DocumentRepositoryImpl();