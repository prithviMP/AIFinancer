from fastapi import APIRouter
from api.v1.endpoints import documents, chat, analytics, websocket

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["documents"]
)

api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["chat"]
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"]
)

api_router.include_router(
    websocket.router,
    prefix="/ws",
    tags=["websocket"]
)
