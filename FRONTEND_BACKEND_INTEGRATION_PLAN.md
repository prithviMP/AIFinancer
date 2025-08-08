# Frontend-Backend Integration Plan

## Current State Analysis

### ✅ **Completed Frontend Components**
- Dashboard page (basic)
- Upload page (basic)
- Layout components (Sidebar, ThemeProvider)
- Some business components (ChatWidget, AnalyticsDashboard, QuickActions)

### ❌ **Missing Pages & Components**
- Documents page (CRUD operations)
- Analytics page (detailed charts)
- Settings page
- Chat page (dedicated)
- Document viewer component

### 🔧 **Backend Integration Needed**
- API client configuration
- Repository pattern implementation
- Error handling
- Real-time updates

---

## 🎯 **Integration Priority Plan**

### **Phase 1: API Integration & Core Components (Week 1)**

#### 1.1 API Client Setup
```typescript
// lib/apiClient.ts
- Configure axios with base URL
- Add request/response interceptors
- Error handling middleware
- Authentication headers (if needed)
```

#### 1.2 Repository Pattern Implementation
```typescript
// repositories/
├── documentRepository.ts    // Document CRUD operations
├── analyticsRepository.ts   // Dashboard & analytics data
├── chatRepository.ts       // Chat messages & sessions
└── userRepository.ts       // User preferences
```

#### 1.3 Missing UI Components
```typescript
// components/ui/
├── DataTable.tsx          // Sortable/filterable tables
├── DocumentViewer.tsx     // PDF/image viewer
├── ProcessingStatus.tsx   // Real-time status updates
├── SearchFilter.tsx       // Advanced search
└── ProgressBar.tsx        // Upload/processing progress
```

### **Phase 2: Missing Pages Implementation (Week 2)**

#### 2.1 Documents Page
```typescript
// pages/Documents.tsx
- Document grid/list view
- Search and filtering
- Document actions (view, delete, download)
- Pagination
- Real-time status updates
```

#### 2.2 Analytics Page
```typescript
// pages/Analytics.tsx
- Interactive charts (recharts)
- Date range selectors
- Export functionality
- Performance metrics
- Trend analysis
```

#### 2.3 Chat Page
```typescript
// pages/Chat.tsx
- Dedicated chat interface
- Message history
- Document context integration
- Real-time messaging
```

#### 2.4 Settings Page
```typescript
// pages/Settings.tsx
- User preferences
- Theme settings
- API configuration
- Account management
```

### **Phase 3: Advanced Features (Week 3)**

#### 3.1 Real-time Features
```typescript
// WebSocket integration
- Document processing status
- Chat real-time updates
- Live analytics updates
```

#### 3.2 Advanced Components
```typescript
// components/business/
├── DocumentUpload.tsx     // Enhanced upload with preview
├── DocumentGrid.tsx       // Advanced document display
├── AnalyticsCharts.tsx    // Interactive charts
└── ChatInterface.tsx      // Full chat functionality
```

---

## 📋 **Detailed Implementation Tasks**

### **Task 1: API Client Configuration**

#### 1.1 Create API Client
```typescript
// lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 1.2 Repository Interfaces
```typescript
// repositories/documentRepository.ts
export interface DocumentRepository {
  uploadDocument(file: File): Promise<DocumentResponse>;
  getDocuments(params: DocumentListParams): Promise<PaginatedResponse<Document>>;
  getDocument(id: string): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  queryDocuments(query: string, documentIds?: string[]): Promise<QueryResponse>;
}

// repositories/analyticsRepository.ts
export interface AnalyticsRepository {
  getDashboardStats(): Promise<DocumentStats>;
  getProcessingQueue(): Promise<ProcessingQueue[]>;
  getReports(params: ReportParams): Promise<ReportResponse>;
  getTrends(period: string): Promise<TrendData>;
}
```

### **Task 2: Missing Pages Implementation**

#### 2.1 Documents Page
```typescript
// pages/Documents.tsx
import { useState, useEffect } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentGrid } from '@/components/business/DocumentGrid';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { Pagination } from '@/components/ui/Pagination';

export default function DocumentsPage() {
  const [filters, setFilters] = useState({
    status: '',
    documentType: '',
    search: '',
    page: 1,
    limit: 20,
  });

  const { documents, isLoading, error } = useDocuments(filters);

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Documents</h1>
          <Button onClick={() => navigate('/upload')}>
            Upload Document
          </Button>
        </div>

        <SearchFilter filters={filters} onFiltersChange={setFilters} />
        
        <DocumentGrid 
          documents={documents?.items || []}
          isLoading={isLoading}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onView={handleView}
        />

        <Pagination 
          currentPage={filters.page}
          totalPages={documents?.pages || 1}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
        />
      </div>
    </Layout>
  );
}
```

#### 2.2 Analytics Page
```typescript
// pages/Analytics.tsx
import { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsCharts } from '@/components/business/AnalyticsCharts';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const { stats, trends, isLoading } = useAnalytics(dateRange);

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <AnalyticsCharts 
          stats={stats}
          trends={trends}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PerformanceMetrics data={stats} />
          <ProcessingTrends data={trends} />
          <DocumentTypeDistribution data={stats} />
        </div>
      </div>
    </Layout>
  );
}
```

#### 2.3 Chat Page
```typescript
// pages/Chat.tsx
import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatInterface } from '@/components/business/ChatInterface';
import { ChatHistory } from '@/components/business/ChatHistory';

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { messages, sendMessage, isLoading } = useChat(sessionId);

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl h-screen flex">
        <div className="w-1/3 border-r">
          <ChatHistory 
            onSessionSelect={setSessionId}
            currentSessionId={sessionId}
          />
        </div>
        <div className="flex-1">
          <ChatInterface 
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
}
```

### **Task 3: Enhanced Components**

#### 3.1 Document Upload Component
```typescript
// components/business/DocumentUpload.tsx
import { useDropzone } from 'react-dropzone';
import { useUploadDocument } from '@/hooks/useUploadDocument';

export function DocumentUpload() {
  const { uploadDocument, isUploading, progress } = useUploadDocument();
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadDocument,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </p>
      </div>

      {isUploading && (
        <ProgressBar value={progress} className="w-full" />
      )}
    </div>
  );
}
```

#### 3.2 Document Grid Component
```typescript
// components/business/DocumentGrid.tsx
import { DocumentCard } from './DocumentCard';
import { ProcessingStatus } from './ProcessingStatus';

interface DocumentGridProps {
  documents: Document[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
}

export function DocumentGrid({ documents, isLoading, onDelete, onDownload, onView }: DocumentGridProps) {
  if (isLoading) {
    return <DocumentGridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDelete={() => onDelete(document.id)}
          onDownload={() => onDownload(document.id)}
          onView={() => onView(document.id)}
        />
      ))}
    </div>
  );
}
```

### **Task 4: Backend Integration Updates**

#### 4.1 Update API Endpoints for Frontend
```python
# server/api/v1/endpoints/documents.py
# Add CORS headers and frontend-friendly responses

@router.get("/", response_model=PaginatedResponse)
async def get_documents(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """
    Get paginated list of documents with filtering
    """
    try:
        documents = await document_service.get_documents(
            db, 
            user_id="default-user",
            page=page,
            limit=limit,
            status=status,
            document_type=document_type,
            search=search
        )
        
        return documents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")
```

#### 4.2 Add WebSocket Support for Real-time Updates
```python
# server/api/v1/endpoints/websocket.py
# Add document processing status updates

@router.websocket("/documents/{document_id}/status")
async def document_status_websocket(websocket: WebSocket, document_id: str):
    await websocket.accept()
    
    try:
        while True:
            # Check document status
            document = await document_service.get_document(db, document_id)
            if document:
                await websocket.send_json({
                    "type": "status_update",
                    "document_id": document_id,
                    "status": document.status,
                    "progress": calculate_progress(document)
                })
            
            await asyncio.sleep(2)  # Check every 2 seconds
            
    except WebSocketDisconnect:
        logger.info(f"Document status WebSocket disconnected: {document_id}")
```

### **Task 5: State Management & Hooks**

#### 5.1 Custom Hooks for API Integration
```typescript
// hooks/useDocuments.ts
export function useDocuments(filters: DocumentListParams = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentRepository.getDocuments(filters),
    staleTime: 30000, // 30 seconds
  });
}

// hooks/useUploadDocument.ts
export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (files: File[]) => 
      Promise.all(files.map(file => documentRepository.uploadDocument(file))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// hooks/useChat.ts
export function useChat(sessionId: string | null) {
  const queryClient = useQueryClient();
  
  const { data: messages } = useQuery({
    queryKey: ['chat', sessionId],
    queryFn: () => chatRepository.getMessages(sessionId),
    enabled: !!sessionId,
  });
  
  const sendMessage = useMutation({
    mutationFn: (content: string) => 
      chatRepository.sendMessage(sessionId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', sessionId] });
    },
  });
  
  return { messages, sendMessage: sendMessage.mutate };
}
```

---

## 🚀 **Implementation Timeline**

### **Week 1: Foundation**
- [ ] API client setup and repository pattern
- [ ] Update backend CORS and error handling
- [ ] Basic missing UI components
- [ ] Document upload integration

### **Week 2: Core Pages**
- [ ] Documents page with CRUD operations
- [ ] Analytics page with charts
- [ ] Chat page with real-time messaging
- [ ] Settings page

### **Week 3: Advanced Features**
- [ ] Real-time document processing updates
- [ ] Advanced search and filtering
- [ ] Document viewer component
- [ ] Performance optimizations

### **Week 4: Polish & Testing**
- [ ] Error handling and loading states
- [ ] Responsive design improvements
- [ ] Integration testing
- [ ] Documentation

---

## 📊 **Success Metrics**

### **Functionality**
- [ ] All pages load without errors
- [ ] Document upload works end-to-end
- [ ] Real-time updates function properly
- [ ] Chat interface is responsive

### **Performance**
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Smooth real-time updates
- [ ] Efficient data caching

### **User Experience**
- [ ] Intuitive navigation
- [ ] Responsive design on all devices
- [ ] Clear error messages
- [ ] Loading states for all async operations

This plan provides a comprehensive roadmap for integrating the frontend with the backend and implementing all missing functionality!
