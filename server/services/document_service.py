from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from core.models import Document, User
from core.schemas import DocumentCreate, DocumentUpdate, PaginatedResponse
from services.ai_service import AIService
from services.ocr_service import OCRService
from services.embedding_service import EmbeddingService
from fastapi import UploadFile
from fastapi.responses import FileResponse
import os
import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
from app.database import SessionLocal

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.ai_service = AIService()
        self.ocr_service = OCRService()
        self.embedding_service = EmbeddingService(base_dir="vectorstore")
        os.makedirs("uploads", exist_ok=True)

    def _infer_document_type(self, text: str, filename: str, mime_type: str) -> str:
        name = (filename or "").lower()
        t = (text or "").lower()
        if any(k in name for k in ["invoice", "inv-"]) or "invoice" in t:
            return "invoice"
        if any(k in name for k in ["contract", "agreement"]) or any(k in t for k in ["contract", "agreement"]):
            return "contract"
        if any(k in name for k in ["receipt", "bill"]) or "receipt" in t:
            return "receipt"
        if any(k in name for k in ["statement"]) or "balance sheet" in t or "income statement" in t:
            return "financial_statement"
        if mime_type.startswith("image/") and not t:
            return "other"
        return "other"

    async def _ensure_user(self, db: Session, user_id: str) -> User:
        # Query only the primary key to avoid selecting columns that may not exist
        existing = db.query(User.id).filter(User.id == user_id).first()
        if existing:
            # Return a lightweight instance with just the id to avoid selecting all columns
            return User(id=user_id)

        # Create a minimal default user to satisfy FK constraints
        user = User(
            id=user_id,
            username=f"user_{user_id[:8]}",
            password="",
            name="Default User",
            role="Finance Manager",
        )
        db.add(user)
        db.commit()
        # Do not call refresh() to avoid selecting all columns on legacy schemas
        return user

    async def upload_document(self, db: Session, file: UploadFile, user_id: str) -> Document:
        """
        Persist uploaded file and create a Document row, then kick off async processing.
        """
        try:
            await self._ensure_user(db, user_id)

            original_name = file.filename or f"upload-{uuid.uuid4().hex}"
            ext = os.path.splitext(original_name)[1]
            stored_filename = f"{uuid.uuid4().hex}{ext}"
            stored_path = os.path.join("uploads", stored_filename)

            # Save file to disk
            with open(stored_path, "wb") as out_f:
                content = await file.read()
                out_f.write(content)

            size_bytes = os.path.getsize(stored_path)
            mime_type = file.content_type or "application/octet-stream"

            # Create DB row
            document_data: Dict[str, Any] = {
                "filename": stored_filename,
                "original_name": original_name,
                "mime_type": mime_type,
                "size": size_bytes,
                "uploaded_by": user_id,
                "status": "pending",
            }

            document = await self.create_document(db, document_data)

            # Kick off async processing
            asyncio.create_task(self.process_document_async(document.id, stored_path))

            return document
        except Exception:
            logger.exception("Upload failed")
            raise

    async def download_document(self, db: Session, document_id: str, user_id: str):
        """
        Return a FileResponse for the stored document if owned by user.
        """
        try:
            doc = await self.get_document(db, document_id, user_id)
            if not doc:
                return None
            path = os.path.join("uploads", doc.filename)
            if not os.path.exists(path):
                return None
            return FileResponse(
                path,
                media_type=doc.mime_type or "application/octet-stream",
                filename=doc.original_name,
            )
        except Exception:
            logger.exception(f"Download failed for {document_id}")
            raise
    
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
        document_type: Optional[str] = None,
        search: Optional[str] = None,
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
            if search:
                like = f"%{search}%"
                query = query.filter(
                    or_(
                        Document.original_name.ilike(like),
                        Document.filename.ilike(like),
                        Document.document_type.ilike(like),
                        Document.ocr_text.ilike(like),
                    )
                )
            
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
    
    async def get_document(self, db: Session, document_id: str, user_id: Optional[str] = None) -> Optional[Document]:
        """
        Get a specific document by ID
        """
        try:
            query = db.query(Document).filter(Document.id == document_id)
            if user_id:
                query = query.filter(Document.uploaded_by == user_id)
            return query.first()
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
    
    async def delete_document(self, db: Session, document_id: str, user_id: Optional[str] = None) -> bool:
        """
        Delete a document and its file
        """
        try:
            query = db.query(Document).filter(Document.id == document_id)
            if user_id:
                query = query.filter(Document.uploaded_by == user_id)
            document = query.first()
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
            
            # Load current document to access stored metadata (e.g., mime_type, original_name)
            with SessionLocal() as db:
                doc_row = db.query(Document).filter(Document.id == document_id).first()
                mime_type = (doc_row.mime_type or "application/octet-stream") if doc_row else "application/octet-stream"
                original_name = (doc_row.original_name if doc_row else os.path.basename(file_path))

            # Update document with results
            # Prefer LLM-provided type; otherwise infer heuristically
            llm_type = analysis.get("document_type") if isinstance(analysis, dict) else None
            inferred_type = self._infer_document_type(ocr_text or "", os.path.basename(file_path), mime_type)

            # Extract total amount if available (handle nested 'entities')
            total_amount = None
            if isinstance(analysis, dict):
                if analysis.get("total_amount") is not None:
                    total_amount = analysis.get("total_amount")
                else:
                    ents = analysis.get("entities") or {}
                    if isinstance(ents, dict):
                        total_amount = ents.get("total_amount")

            update_data = DocumentUpdate(
                status="completed",
                processed_at=datetime.utcnow(),
                ocr_text=ocr_text,
                document_type=llm_type or inferred_type,
                extracted_data=analysis if isinstance(analysis, dict) else {},
                total_value=(int(total_amount * 100) if isinstance(total_amount, (int, float)) else None)
            )
            
            await self.update_document_by_id(document_id, update_data)

            # Index embeddings for retrieval (best-effort)
            try:
                self.embedding_service.index_document(
                    user_id="default-user",
                    document_id=document_id,
                    filename=original_name,
                    doc_type=(llm_type or inferred_type),
                    text=ocr_text,
                )
            except Exception as exc:
                logger.warning(f"Embedding index failed for {document_id}: {exc}")
            logger.info(f"Completed processing document: {document_id}")
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            await self.update_document_status(document_id, "failed")
            raise
    
    async def update_document_status(self, document_id: str, status: str):
        """
        Update document status
        """
        try:
            with SessionLocal() as db:
                doc = db.query(Document).filter(Document.id == document_id).first()
                if not doc:
                    return
                doc.status = status
                if status in ("failed", "completed"):
                    doc.processed_at = datetime.utcnow()
                db.commit()
        except Exception:
            logger.exception(f"Failed updating status for {document_id} -> {status}")
    
    async def update_document_by_id(self, document_id: str, update_data: DocumentUpdate):
        """
        Update document by ID
        """
        try:
            with SessionLocal() as db:
                doc = db.query(Document).filter(Document.id == document_id).first()
                if not doc:
                    return
                data = update_data.dict(exclude_unset=True)
                for field, value in data.items():
                    setattr(doc, field, value)
                db.commit()
        except Exception:
            logger.exception(f"Failed updating document by id {document_id}")
    
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
            # Retrieve top chunks via embeddings (falls back to keyword if embeddings disabled)
            retrieved = self.embedding_service.retrieve(
                user_id=user_id,
                query=query,
                document_ids=document_ids,
                k=5,
            )

            # Prepare context; if no retrieved chunks (e.g., no vector store yet), use raw documents
            context: List[Dict[str, Any]] = []
            if retrieved:
                # augment entries with doc metadata from DB
                doc_ids = list({e["document_id"] for e in retrieved})
                docs = db.query(Document).filter(Document.id.in_(doc_ids)).all()
                id_to_doc = {d.id: d for d in docs}
                for e in retrieved:
                    d = id_to_doc.get(e["document_id"])  # may be None if missing
                    context.append({
                        "id": e["document_id"],
                        "type": (d.document_type if d else e.get("metadata", {}).get("type")),
                        "filename": (d.original_name if d else e.get("metadata", {}).get("filename")),
                        "text": e.get("text", ""),
                        "extracted_data": (d.extracted_data if d else None),
                    })
            else:
                documents_query = db.query(Document).filter(Document.uploaded_by == user_id)
                if document_ids:
                    documents_query = documents_query.filter(Document.id.in_(document_ids))
                documents = documents_query.all()
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
