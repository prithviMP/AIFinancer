from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from core.models import Document, User
from core.schemas import DocumentStats, ProcessingQueue
from services.analytics_service import AnalyticsService

router = APIRouter()

# Initialize analytics service
analytics_service = AnalyticsService()

@router.get("/dashboard", response_model=DocumentStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        stats = await analytics_service.get_document_stats(db, user_id)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")

@router.get("/processing-queue", response_model=List[ProcessingQueue])
async def get_processing_queue(db: Session = Depends(get_db)):
    """
    Get processing queue status
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        queue = await analytics_service.get_processing_queue(db, user_id)
        return queue
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch processing queue: {str(e)}")

@router.get("/reports")
async def get_reports(
    db: Session = Depends(get_db),
    report_type: str = "summary",
    date_from: str = None,
    date_to: str = None
):
    """
    Get various reports
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        reports = await analytics_service.generate_reports(
            db, 
            user_id, 
            report_type, 
            date_from, 
            date_to
        )
        return reports
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate reports: {str(e)}")

@router.get("/trends")
async def get_trends(
    db: Session = Depends(get_db),
    period: str = "30d"
):
    """
    Get document processing trends
    """
    try:
        user_id = "default-user"  # TODO: Get from authentication
        
        trends = await analytics_service.get_processing_trends(db, user_id, period)
        return trends
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends: {str(e)}")

@router.get("/performance")
async def get_performance_metrics(db: Session = Depends(get_db)):
    """
    Get system performance metrics
    """
    try:
        metrics = await analytics_service.get_performance_metrics(db)
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch performance metrics: {str(e)}")
