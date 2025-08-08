from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="Finance Manager")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    filename: str
    original_name: str
    mime_type: str
    size: int

class DocumentCreate(DocumentBase):
    uploaded_by: str

class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    document_type: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    ocr_text: Optional[str] = None
    total_value: Optional[int] = None
    processed_at: Optional[datetime] = None

class DocumentResponse(DocumentBase):
    id: str
    uploaded_by: str
    uploaded_at: datetime
    processed_at: Optional[datetime]
    status: str
    document_type: Optional[str]
    total_value: Optional[int]
    
    class Config:
        from_attributes = True

# Chat schemas
class ChatSessionBase(BaseModel):
    user_id: str

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: str
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    content: str = Field(..., min_length=1)
    is_from_user: bool

class ChatMessageCreate(ChatMessageBase):
    session_id: str
    document_context: Optional[Dict[str, Any]] = None

class ChatMessageResponse(ChatMessageBase):
    id: str
    session_id: str
    timestamp: datetime
    document_context: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True

# Query schemas
class DocumentQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language query about documents")
    document_ids: Optional[List[str]] = Field(None, description="Specific documents to query")

class QueryResponse(BaseModel):
    query: str
    response: str
    context_documents: int
    confidence: Optional[float] = None
    sources: Optional[List[str]] = None

# Analytics schemas
class DocumentStats(BaseModel):
    total_documents: int
    processed_today: int
    total_value: int
    processing_success_rate: float
    documents_by_type: Dict[str, int]
    daily_processing: List[Dict[str, Any]]

class ProcessingQueue(BaseModel):
    id: str
    filename: str
    status: str
    progress: int
    type: str

# File upload schemas
class FileUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str

# Error schemas
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Pagination schemas
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int
