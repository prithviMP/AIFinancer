import { apiClient } from './apiClient';
import { ApiResponse, PaginatedResponse, RequestOptions } from './types';
import { Document, DocumentStats, ProcessingQueue } from '@shared/schema';

export interface DocumentFilters {
  status?: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DocumentListOptions extends RequestOptions {
  page?: number;
  limit?: number;
  filters?: DocumentFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentUploadData {
  file: File;
  documentType?: string;
}

export class DocumentRepository {
  private readonly basePath = '/api/documents';

  async getDocuments(options: DocumentListOptions = {}): Promise<Document[]> {
    const { page, limit, filters, sortBy, sortOrder, ...requestOptions } = options;
    
    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
      ...filters,
    };

    return apiClient.get<Document[]>(this.basePath, {
      ...requestOptions,
      params,
    });
  }

  async getDocument(id: string, options?: RequestOptions): Promise<Document> {
    return apiClient.get<Document>(`${this.basePath}/${id}`, options);
  }

  async uploadDocument(data: DocumentUploadData, options?: RequestOptions): Promise<Document> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    if (data.documentType) {
      formData.append('documentType', data.documentType);
    }

    return apiClient.upload<Document>(`${this.basePath}/upload`, formData, options);
  }

  async deleteDocument(id: string, options?: RequestOptions): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getProcessingQueue(options?: RequestOptions): Promise<ProcessingQueue[]> {
    return apiClient.get<ProcessingQueue[]>(`${this.basePath}/queue`, options);
  }

  async retryProcessing(id: string, options?: RequestOptions): Promise<Document> {
    return apiClient.post<Document>(`${this.basePath}/${id}/retry`, undefined, options);
  }

  async getDocumentStats(options?: RequestOptions): Promise<DocumentStats> {
    return apiClient.get<DocumentStats>('/api/dashboard/stats', options);
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await fetch(`${apiClient['config'].baseURL}${this.basePath}/${id}/download`);
    
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    return response.blob();
  }

  async searchDocuments(query: string, options?: RequestOptions): Promise<Document[]> {
    return apiClient.get<Document[]>(`${this.basePath}/search`, {
      ...options,
      params: { q: query },
    });
  }
}

// Export singleton instance
export const documentRepository = new DocumentRepository();