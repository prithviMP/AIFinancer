from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from core.models import Document, User
from core.schemas import DocumentCreate, DocumentUpdate, PaginatedResponse
from services.ai_service import AIService
from services.ocr_service import OCRService
import os
import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.ai_service = AIService()
        self.ocr_service = OCRService()
    
    async def create_document(self, db: Session, document_data: Dict[str, Any]) -> Document:
        """
        Create a new document record
        """
        try:
            document = Document(**document_data)
            db.add(document)
            db.commit()
            db.refresh(document)
            logger.info(f"Created document: {document.id}")
            return document
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating document: {e}")
            raise
    
    async def get_documents(
        self, 
        db: Session, 
        user_id: str,
        page: int = 1,
        limit: int = 10,
        status: Optional[str] = None,
        document_type: Optional[str] = None
    ) -> PaginatedResponse:
        """
        Get paginated list of documents with filtering
        """
        try:
            # Build query
            query = db.query(Document).filter(Document.uploaded_by == user_id)
            
            if status:
                query = query.filter(Document.status == status)
            if document_type:
                query = query.filter(Document.document_type == document_type)
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * limit
            documents = query.order_by(desc(Document.uploaded_at)).offset(offset).limit(limit).all()
            
            # Calculate pages
            pages = (total + limit - 1) // limit
            
            return PaginatedResponse(
                items=documents,
                total=total,
                page=page,
                limit=limit,
                pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error fetching documents: {e}")
            raise
    
    async def get_document(self, db: Session, document_id: str) -> Optional[Document]:
        """
        Get a specific document by ID
        """
        try:
            return db.query(Document).filter(Document.id == document_id).first()
        except Exception as e:
            logger.error(f"Error fetching document {document_id}: {e}")
            raise
    
    async def update_document(self, db: Session, document_id: str, update_data: DocumentUpdate) -> Optional[Document]:
        """
        Update a document
        """
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                return None
            
            for field, value in update_data.dict(exclude_unset=True).items():
                setattr(document, field, value)
            
            db.commit()
            db.refresh(document)
            logger.info(f"Updated document: {document_id}")
            return document
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating document {document_id}: {e}")
            raise
    
    async def delete_document(self, db: Session, document_id: str) -> bool:
        """
        Delete a document and its file
        """
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                return False
            
            # Delete file from disk
            file_path = os.path.join("uploads", document.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Delete from database
            db.delete(document)
            db.commit()
            logger.info(f"Deleted document: {document_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting document {document_id}: {e}")
            raise
    
    async def process_document_async(self, document_id: str, file_path: str):
        """
        Process document asynchronously
        """
        try:
            # Update status to processing
            await self.update_document_status(document_id, "processing")
            
            # Extract text using OCR
            ocr_text = await self.ocr_service.extract_text(file_path)
            
            # Analyze with AI
            analysis = await self.ai_service.analyze_document(ocr_text, file_path)
            
            # Update document with results
            update_data = DocumentUpdate(
                status="completed",
                processed_at=datetime.utcnow(),
                ocr_text=ocr_text,
                document_type=analysis.get("document_type"),
                extracted_data=analysis,
                total_value=analysis.get("total_amount", 0) * 100 if analysis.get("total_amount") else None
            )
            
            await self.update_document_by_id(document_id, update_data)
            logger.info(f"Completed processing document: {document_id}")
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            await self.update_document_status(document_id, "failed")
            raise
    
    async def update_document_status(self, document_id: str, status: str):
        """
        Update document status
        """
        # This would typically use a database session
        # For now, we'll implement this in the actual service
        pass
    
    async def update_document_by_id(self, document_id: str, update_data: DocumentUpdate):
        """
        Update document by ID
        """
        # This would typically use a database session
        # For now, we'll implement this in the actual service
        pass
    
    async def query_documents(
        self, 
        db: Session, 
        query: str, 
        document_ids: Optional[List[str]] = None,
        user_id: str = "default-user"
    ) -> Dict[str, Any]:
        """
        Query documents using AI
        """
        try:
            # Get user documents for context
            documents_query = db.query(Document).filter(Document.uploaded_by == user_id)
            
            if document_ids:
                documents_query = documents_query.filter(Document.id.in_(document_ids))
            
            documents = documents_query.all()
            
            # Prepare context for AI
            context = []
            for doc in documents:
                if doc.ocr_text:
                    context.append({
                        "id": doc.id,
                        "type": doc.document_type,
                        "filename": doc.original_name,
                        "text": doc.ocr_text,
                        "extracted_data": doc.extracted_data
                    })
            
            # Generate AI response
            response = await self.ai_service.generate_query_response(query, context)
            
            return {
                "query": query,
                "response": response,
                "context_documents": len(context),
                "confidence": 0.85,  # TODO: Get from AI service
                "sources": [doc["filename"] for doc in context]
            }
            
        except Exception as e:
            logger.error(f"Error querying documents: {e}")
            raise
