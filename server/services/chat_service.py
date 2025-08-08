from sqlalchemy.orm import Session
from sqlalchemy import desc
from core.models import ChatSession, ChatMessage, User
from core.schemas import ChatSessionResponse, ChatMessageResponse
from services.ai_service import AIService
import logging
from typing import List, Optional
from datetime import datetime
from sqlalchemy import and_
from core.models import Document

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.ai_service = AIService()
    
    async def create_session(self, db: Session, user_id: str) -> ChatSessionResponse:
        """
        Create a new chat session
        """
        try:
            session = ChatSession(user_id=user_id)
            db.add(session)
            db.commit()
            db.refresh(session)
            
            logger.info(f"Created chat session: {session.id}")
            return ChatSessionResponse.from_orm(session)
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating chat session: {e}")
            raise
    
    async def get_sessions(self, db: Session, user_id: str) -> List[ChatSessionResponse]:
        """
        Get all chat sessions for user
        """
        try:
            sessions = db.query(ChatSession).filter(
                ChatSession.user_id == user_id
            ).order_by(desc(ChatSession.created_at)).all()
            
            return [ChatSessionResponse.from_orm(session) for session in sessions]
            
        except Exception as e:
            logger.error(f"Error getting chat sessions: {e}")
            raise
    
    async def delete_session(self, db: Session, session_id: str, user_id: str) -> bool:
        """
        Delete a chat session
        """
        try:
            session = db.query(ChatSession).filter(
                and_(
                    ChatSession.id == session_id,
                    ChatSession.user_id == user_id
                )
            ).first()
            
            if not session:
                return False
            
            # Delete all messages in the session
            db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
            
            # Delete the session
            db.delete(session)
            db.commit()
            
            logger.info(f"Deleted chat session: {session_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting chat session: {e}")
            raise
    
    async def save_message(
        self, 
        db: Session, 
        session_id: str, 
        content: str, 
        is_from_user: bool,
        user_id: str,
        document_context: Optional[dict] = None
    ) -> ChatMessageResponse:
        """
        Save a chat message
        """
        try:
            message = ChatMessage(
                session_id=session_id,
                content=content,
                is_from_user=is_from_user,
                document_context=document_context
            )
            
            db.add(message)
            db.commit()
            db.refresh(message)
            
            logger.info(f"Saved chat message: {message.id}")
            return ChatMessageResponse.from_orm(message)
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving chat message: {e}")
            raise
    
    async def get_chat_history(
        self, 
        db: Session, 
        user_id: str, 
        session_id: Optional[str] = None
    ) -> List[ChatMessageResponse]:
        """
        Get chat history for a session or all sessions
        """
        try:
            if session_id:
                # Get messages for specific session
                messages = db.query(ChatMessage).filter(
                    ChatMessage.session_id == session_id
                ).order_by(ChatMessage.timestamp).all()
            else:
                # Get messages from all user sessions
                session_ids = db.query(ChatSession.id).filter(
                    ChatSession.user_id == user_id
                ).subquery()
                
                messages = db.query(ChatMessage).filter(
                    ChatMessage.session_id.in_(session_ids)
                ).order_by(ChatMessage.timestamp).all()
            
            return [ChatMessageResponse.from_orm(message) for message in messages]
            
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            raise
    
    async def generate_response(
        self, 
        db: Session, 
        session_id: str, 
        user_message: str,
        user_id: str
    ) -> str:
        """
        Generate AI response to user message
        """
        try:
            # Get user's documents for context
            user_documents = db.query(Document).filter(
                Document.uploaded_by == user_id
            ).all()
            
            # Prepare document context
            document_context = []
            for doc in user_documents:
                if doc.ocr_text:
                    document_context.append({
                        "id": doc.id,
                        "type": doc.document_type,
                        "filename": doc.original_name,
                        "text": doc.ocr_text[:500],  # Limit text length
                        "extracted_data": doc.extracted_data
                    })
            
            # Generate AI response
            response = await self.ai_service.generate_chat_response(user_message, user_id)
            
            logger.info(f"Generated chat response for session {session_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return "I'm sorry, I encountered an error while processing your message. Please try again."
    
    async def generate_chat_response(self, message: str, user_id: str) -> str:
        """
        Generate chat response using AI service
        """
        try:
            return await self.ai_service.generate_chat_response(message, user_id)
        except Exception as e:
            logger.error(f"Error in generate_chat_response: {e}")
            return "I'm sorry, I encountered an error. Please try again."
    
    async def get_session_messages(self, db: Session, session_id: str) -> List[ChatMessageResponse]:
        """
        Get all messages for a specific session
        """
        try:
            messages = db.query(ChatMessage).filter(
                ChatMessage.session_id == session_id
            ).order_by(ChatMessage.timestamp).all()
            
            return [ChatMessageResponse.from_orm(message) for message in messages]
            
        except Exception as e:
            logger.error(f"Error getting session messages: {e}")
            raise
    
    async def update_session_status(self, db: Session, session_id: str, is_active: bool) -> bool:
        """
        Update session active status
        """
        try:
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                return False
            
            session.is_active = is_active
            db.commit()
            
            logger.info(f"Updated session status: {session_id} -> {is_active}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating session status: {e}")
            raise
