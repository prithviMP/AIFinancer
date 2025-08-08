from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json
import logging
from typing import Dict, List
import uuid

from app.database import get_db
from services.chat_service import ChatService

router = APIRouter()

logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.chat_service = ChatService()
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket connected: {client_id}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket disconnected: {client_id}")
    
    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/chat/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time chat
    """
    await manager.connect(websocket, client_id)
    
    try:
        # Send welcome message
        welcome_message = {
            "type": "message",
            "content": "Hello! I can help you analyze your financial documents. Try asking me about invoices, expenses, or document insights.",
            "timestamp": str(uuid.uuid4()),
            "isFromBot": True,
            "clientId": client_id
        }
        await manager.send_personal_message(json.dumps(welcome_message), client_id)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat" and message_data.get("content"):
                # Process chat message
                user_message = message_data["content"]
                
                # Generate AI response
                ai_response = await manager.chat_service.generate_chat_response(
                    user_message, 
                    "default-user"  # TODO: Get from authentication
                )
                
                # Send AI response
                response_message = {
                    "type": "message",
                    "content": ai_response,
                    "timestamp": str(uuid.uuid4()),
                    "isFromBot": True,
                    "clientId": client_id
                }
                await manager.send_personal_message(json.dumps(response_message), client_id)
                
                logger.info(f"Processed chat message for client {client_id}")
            
            elif message_data.get("type") == "ping":
                # Respond to ping
                pong_message = {
                    "type": "pong",
                    "timestamp": str(uuid.uuid4()),
                    "clientId": client_id
                }
                await manager.send_personal_message(json.dumps(pong_message), client_id)
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        logger.info(f"WebSocket disconnected: {client_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        manager.disconnect(client_id)
        
        # Send error message
        error_message = {
            "type": "error",
            "content": "An error occurred while processing your message.",
            "timestamp": str(uuid.uuid4()),
            "clientId": client_id
        }
        try:
            await manager.send_personal_message(json.dumps(error_message), client_id)
        except:
            pass  # Connection might already be closed
