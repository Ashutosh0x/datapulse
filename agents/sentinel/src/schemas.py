"""
Shared schemas for Sentinel agent
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ServiceMetrics(BaseModel):
    service_name: str
    error_rate: float
    p99_latency: float
    team: Optional[str] = None
    criticality: Optional[str] = None


class AnomalyDetectionResult(BaseModel):
    services_with_anomalies: List[ServiceMetrics]
    detection_timestamp: datetime
    query_window: str


class IncidentEvidence(BaseModel):
    type: str  # metric, log, trace, note
    ref: Optional[str] = None
    text: Optional[str] = None
    snippet: Optional[str] = None


class IncidentPayload(BaseModel):
    source: str
    service: str
    detected_at: str
    severity: str
    metrics: Dict[str, Any]
    evidence: List[IncidentEvidence]
    correlation_id: str
