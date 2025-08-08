from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from core.models import ChatSession, ChatMessage, User
from core.schemas import ChatMessageCreate, ChatMessageResponse, ChatSessionResponse
from services.chat_service import ChatService

router = APIRouter()

# Initialize chat service
chat_service = ChatService()

@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    message: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Send a chat message and get AI response
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        # Save user message
        user_message = await chat_service.save_message(
            db, 
            message.session_id, 
            message.content, 
            is_from_user=True,
            user_id=user_id
        )
        
        # Generate AI response
        ai_response = await chat_service.generate_response(
            db, 
            message.session_id, 
            message.content,
            user_id=user_id
        )
        
        # Save AI response
        ai_message = await chat_service.save_message(
            db, 
            message.session_id, 
            ai_response, 
            is_from_user=False,
            user_id=user_id
        )
        
        return ai_message
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    session_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Get chat history for a session
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        messages = await chat_service.get_chat_history(
            db, 
            user_id, 
            session_id
        )
        return messages
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")

@router.post("/session", response_model=ChatSessionResponse)
async def create_chat_session(
    db: Session = Depends(get_db)
):
    """
    Create a new chat session
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        session = await chat_service.create_session(db, user_id)
        return session
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    db: Session = Depends(get_db)
):
    """
    Get all chat sessions for user
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        sessions = await chat_service.get_sessions(db, user_id)
        return sessions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat sessions: {str(e)}")

@router.delete("/session/{session_id}")
async def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a chat session
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        success = await chat_service.delete_session(db, session_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Chat session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete chat session: {str(e)}")
