from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from core.models import Document, User
from core.schemas import DocumentStats, ProcessingQueue
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        pass
    
    async def get_document_stats(self, db: Session, user_id: str) -> DocumentStats:
        """
        Get comprehensive document statistics for dashboard
        """
        try:
            # Get total documents
            total_documents = db.query(Document).filter(
                Document.uploaded_by == user_id
            ).count()
            
            # Get documents processed today
            today = datetime.utcnow().date()
            processed_today = db.query(Document).filter(
                and_(
                    Document.uploaded_by == user_id,
                    func.date(Document.processed_at) == today
                )
            ).count()
            
            # Get total value
            total_value_result = db.query(func.sum(Document.total_value)).filter(
                and_(
                    Document.uploaded_by == user_id,
                    Document.total_value.isnot(None)
                )
            ).scalar()
            total_value = int(total_value_result) if total_value_result else 0
            
            # Get processing success rate
            completed_docs = db.query(Document).filter(
                and_(
                    Document.uploaded_by == user_id,
                    Document.status == "completed"
                )
            ).count()
            
            failed_docs = db.query(Document).filter(
                and_(
                    Document.uploaded_by == user_id,
                    Document.status == "failed"
                )
            ).count()
            
            total_processed = completed_docs + failed_docs
            processing_success_rate = (completed_docs / total_processed * 100) if total_processed > 0 else 0
            
            # Get documents by type
            documents_by_type = {}
            type_counts = db.query(
                Document.document_type,
                func.count(Document.id)
            ).filter(
                Document.uploaded_by == user_id
            ).group_by(Document.document_type).all()
            
            for doc_type, count in type_counts:
                documents_by_type[doc_type or "unknown"] = count
            
            # Get daily processing for last 30 days
            daily_processing = []
            for i in range(30):
                date = today - timedelta(days=i)
                count = db.query(Document).filter(
                    and_(
                        Document.uploaded_by == user_id,
                        func.date(Document.uploaded_at) == date
                    )
                ).count()
                daily_processing.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "count": count
                })
            
            daily_processing.reverse()  # Most recent first
            
            return DocumentStats(
                total_documents=total_documents,
                processed_today=processed_today,
                total_value=total_value,
                processing_success_rate=processing_success_rate,
                documents_by_type=documents_by_type,
                daily_processing=daily_processing
            )
            
        except Exception as e:
            logger.error(f"Error getting document stats: {e}")
            raise
    
    async def get_processing_queue(self, db: Session, user_id: str) -> List[ProcessingQueue]:
        """
        Get current processing queue status
        """
        try:
            # Get documents currently processing
            processing_docs = db.query(Document).filter(
                and_(
                    Document.uploaded_by == user_id,
                    Document.status == "processing"
                )
            ).all()
            
            queue = []
            for doc in processing_docs:
                # Determine file type
                file_extension = doc.filename.split('.')[-1].lower() if '.' in doc.filename else 'unknown'
                file_type = 'pdf' if file_extension == 'pdf' else 'image' if file_extension in ['jpg', 'jpeg', 'png'] else 'other'
                
                # Estimate progress (simple heuristic)
                progress = 50  # Default progress
                if doc.processed_at:
                    progress = 100
                elif doc.uploaded_at:
                    # Estimate based on time since upload
                    time_diff = datetime.utcnow() - doc.uploaded_at
                    progress = min(90, int(time_diff.total_seconds() / 30))  # 30 seconds = 90% progress
                
                queue.append(ProcessingQueue(
                    id=doc.id,
                    filename=doc.original_name,
                    status=doc.status,
                    progress=progress,
                    type=file_type
                ))
            
            return queue
            
        except Exception as e:
            logger.error(f"Error getting processing queue: {e}")
            raise
    
    async def generate_reports(
        self, 
        db: Session, 
        user_id: str, 
        report_type: str = "summary",
        date_from: str = None,
        date_to: str = None
    ) -> Dict[str, Any]:
        """
        Generate various reports
        """
        try:
            if report_type == "summary":
                return await self._generate_summary_report(db, user_id, date_from, date_to)
            elif report_type == "financial":
                return await self._generate_financial_report(db, user_id, date_from, date_to)
            elif report_type == "processing":
                return await self._generate_processing_report(db, user_id, date_from, date_to)
            else:
                raise ValueError(f"Unknown report type: {report_type}")
                
        except Exception as e:
            logger.error(f"Error generating reports: {e}")
            raise
    
    async def _generate_summary_report(self, db: Session, user_id: str, date_from: str, date_to: str) -> Dict[str, Any]:
        """
        Generate summary report
        """
        query = db.query(Document).filter(Document.uploaded_by == user_id)
        
        if date_from:
            query = query.filter(Document.uploaded_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Document.uploaded_at <= datetime.fromisoformat(date_to))
        
        documents = query.all()
        
        return {
            "report_type": "summary",
            "period": {"from": date_from, "to": date_to},
            "total_documents": len(documents),
            "by_status": {
                "completed": len([d for d in documents if d.status == "completed"]),
                "processing": len([d for d in documents if d.status == "processing"]),
                "failed": len([d for d in documents if d.status == "failed"]),
                "pending": len([d for d in documents if d.status == "pending"])
            },
            "by_type": {},
            "total_value": sum(d.total_value or 0 for d in documents)
        }
    
    async def _generate_financial_report(self, db: Session, user_id: str, date_from: str, date_to: str) -> Dict[str, Any]:
        """
        Generate financial report
        """
        query = db.query(Document).filter(
            and_(
                Document.uploaded_by == user_id,
                Document.document_type.in_(["invoice", "receipt"])
            )
        )
        
        if date_from:
            query = query.filter(Document.uploaded_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Document.uploaded_at <= datetime.fromisoformat(date_to))
        
        documents = query.all()
        
        total_value = sum(d.total_value or 0 for d in documents)
        
        return {
            "report_type": "financial",
            "period": {"from": date_from, "to": date_to},
            "total_invoices": len([d for d in documents if d.document_type == "invoice"]),
            "total_receipts": len([d for d in documents if d.document_type == "receipt"]),
            "total_value": total_value,
            "average_value": total_value / len(documents) if documents else 0
        }
    
    async def _generate_processing_report(self, db: Session, user_id: str, date_from: str, date_to: str) -> Dict[str, Any]:
        """
        Generate processing performance report
        """
        query = db.query(Document).filter(Document.uploaded_by == user_id)
        
        if date_from:
            query = query.filter(Document.uploaded_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Document.uploaded_at <= datetime.fromisoformat(date_to))
        
        documents = query.all()
        
        completed = [d for d in documents if d.status == "completed"]
        failed = [d for d in documents if d.status == "failed"]
        
        # Calculate average processing time
        processing_times = []
        for doc in completed:
            if doc.processed_at and doc.uploaded_at:
                processing_time = (doc.processed_at - doc.uploaded_at).total_seconds()
                processing_times.append(processing_time)
        
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        return {
            "report_type": "processing",
            "period": {"from": date_from, "to": date_to},
            "total_processed": len(completed) + len(failed),
            "success_rate": len(completed) / (len(completed) + len(failed)) * 100 if (len(completed) + len(failed)) > 0 else 0,
            "average_processing_time": avg_processing_time,
            "successful_processing": len(completed),
            "failed_processing": len(failed)
        }
    
    async def get_processing_trends(self, db: Session, user_id: str, period: str = "30d") -> Dict[str, Any]:
        """
        Get processing trends over time
        """
        try:
            days = int(period.replace('d', '')) if 'd' in period else 30
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get daily counts
            daily_counts = db.query(
                func.date(Document.uploaded_at).label('date'),
                func.count(Document.id).label('count')
            ).filter(
                and_(
                    Document.uploaded_by == user_id,
                    Document.uploaded_at >= start_date,
                    Document.uploaded_at <= end_date
                )
            ).group_by(func.date(Document.uploaded_at)).all()
            
            # Convert to dictionary
            trends = {}
            for date, count in daily_counts:
                trends[date.strftime("%Y-%m-%d")] = count
            
            return {
                "period": period,
                "trends": trends,
                "total_documents": sum(trends.values())
            }
            
        except Exception as e:
            logger.error(f"Error getting processing trends: {e}")
            raise
    
    async def get_performance_metrics(self, db: Session) -> Dict[str, Any]:
        """
        Get system performance metrics
        """
        try:
            # Get recent processing times
            recent_docs = db.query(Document).filter(
                and_(
                    Document.status == "completed",
                    Document.processed_at.isnot(None),
                    Document.uploaded_at.isnot(None)
                )
            ).order_by(desc(Document.processed_at)).limit(100).all()
            
            processing_times = []
            for doc in recent_docs:
                processing_time = (doc.processed_at - doc.uploaded_at).total_seconds()
                processing_times.append(processing_time)
            
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
            min_processing_time = min(processing_times) if processing_times else 0
            max_processing_time = max(processing_times) if processing_times else 0
            
            return {
                "average_processing_time": avg_processing_time,
                "min_processing_time": min_processing_time,
                "max_processing_time": max_processing_time,
                "total_processed_recently": len(processing_times),
                "system_health": "healthy" if avg_processing_time < 60 else "degraded"
            }
            
        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            raise
