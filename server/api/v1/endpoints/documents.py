from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.database import get_db
from services.document_service import DocumentService
from core.schemas import DocumentResponse, DocumentListResponse, QueryRequest, QueryResponse, FileUploadResponse

router = APIRouter()
logger = logging.getLogger(__name__)

document_service = DocumentService()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document for processing
    """
    try:
        # Validate file type
        if not file.content_type in ["application/pdf", "image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # Upload and process document
        result = await document_service.upload_document(db, file, "default-user")
        
        return FileUploadResponse(
            id=result.id,
            filename=result.filename,
            status=result.status,
            message="Document uploaded successfully"
        )
        
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/", response_model=DocumentListResponse)
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
        logger.error(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific document by ID
    """
    try:
        document = await document_service.get_document(db, document_id, "default-user")
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a document
    """
    try:
        success = await document_service.delete_document(db, document_id, "default-user")
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Download a document file
    """
    try:
        file_data = await document_service.download_document(db, document_id, "default-user")
        if not file_data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return file_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")

@router.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """
    Query documents using natural language
    """
    try:
        result = await document_service.query_documents(
            db, 
            request.query, 
            request.document_ids,
            "default-user"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error querying documents: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
