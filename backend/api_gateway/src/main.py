import os
import uuid
import hashlib
import hmac
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Header
from pydantic import BaseModel
from elasticsearch import AsyncElasticsearch, NotFoundError
from loguru import logger
import httpx

# Use the new package structure
try:
    from jira_adapter.jira_adapter import JiraAdapter
    from slack_adapter.slack_adapter import SlackAdapter
except ImportError:
    # Fallback for local development if not installed as package
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../../integrations/mcp-adapters"))
    from jira_adapter.jira_adapter import JiraAdapter
    from slack_adapter.slack_adapter import SlackAdapter

app = FastAPI(title="DataPulse API Gateway", version="1.0.0")

ES_HOST = os.getenv("ES_HOST", "http://elasticsearch:9200")
es = AsyncElasticsearch(hosts=[ES_HOST])

# Service URLs
ANALYST_URL = os.getenv("ANALYST_URL", "http://analyst:8000")
RESOLVER_URL = os.getenv("RESOLVER_URL", "http://resolver:8000")

# Indexing Configuration
INDEX_INCIDENTS = os.getenv("INDEX_INCIDENTS", ".incidents-datapulse-000001")
INDEX_AUDIT = os.getenv("INDEX_AUDIT", ".audit-datapulse-000001")

# Lazy load integrations
_slack_adapter = None
_jira_adapter = None

def get_slack_adapter():
    global _slack_adapter
    if _slack_adapter is None:
        try:
            _slack_adapter = SlackAdapter()
        except Exception as e:
            logger.warning(f"Slack adapter not available: {e}")
    return _slack_adapter

def get_jira_adapter():
    global _jira_adapter
    if _jira_adapter is None:
        try:
            _jira_adapter = JiraAdapter()
        except Exception as e:
            logger.warning(f"Jira adapter not available: {e}")
    return _jira_adapter

# --- Models ---
class MetricData(BaseModel):
    error_rate: float
    p99_latency_ms: float

class Evidence(BaseModel):
    type: str
    ref: Optional[str] = None
    text: Optional[str] = None
    snippet: Optional[str] = None

class CreateIncidentRequest(BaseModel):
    source: str
    service: str
    detected_at: str
    severity: str
    metrics: MetricData
    evidence: List[Evidence]
    correlation_id: str

class AgentReport(BaseModel):
    incident_id: str
    agent: str
    timestamp: Optional[str] = None
    rcca: Optional[Dict[str, Any]] = None
    proposals: Optional[List[Dict[str, Any]]] = None

def serialize_incident(incident_doc: Dict[str, Any], fallback_id: Optional[str] = None) -> Dict[str, Any]:
    """Normalize incident records returned by API list/detail endpoints."""
    normalized = dict(incident_doc)
    if "incident_id" not in normalized and fallback_id:
        normalized["incident_id"] = fallback_id
    return normalized

def _find_action(proposals: List[Dict[str, Any]], action_id: str) -> Optional[Dict[str, Any]]:
    for proposal in proposals:
        if proposal.get("action_id") == action_id:
            return proposal
    return None

# --- Endpoints ---

@app.post("/api/datapulse/v1/incidents", status_code=201)
async def create_incident(req: CreateIncidentRequest, background_tasks: BackgroundTasks):
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    doc = req.dict()
    doc["incident_id"] = incident_id
    doc["status"] = "open"
    doc["created_at"] = datetime.now().isoformat()
    doc["timeline"] = [{"timestamp": doc["created_at"], "event": "Incident Detected by Sentinel"}]
    
    # 1. Save to ES
    try:
        await es.index(index=INDEX_INCIDENTS, id=incident_id, document=doc)
        logger.bind(correlation_id=req.correlation_id, incident_id=incident_id).info(
            f"Created incident {incident_id} in {INDEX_INCIDENTS}"
        )
    except Exception as e:
        error_payload = {
            "code": "INCIDENT_PERSISTENCE_FAILED",
            "message": "Failed to persist incident in datastore",
            "correlation_id": req.correlation_id,
            "incident_id": incident_id,
            "index": INDEX_INCIDENTS,
            "exception_type": type(e).__name__,
        }
        logger.bind(correlation_id=req.correlation_id, incident_id=incident_id).error(
            "Incident persistence failed",
            error_payload={**error_payload, "exception": str(e)},
        )
        raise HTTPException(status_code=503, detail=error_payload)
    
    # 2. Trigger integrations  
    background_tasks.add_task(notify_integrations, doc)
    
    # 3. Trigger Analyst
    background_tasks.add_task(trigger_analyst, incident_id, req.service, req.detected_at)
    
    return {"incident_id": incident_id, "status": "open"}

@app.get("/api/datapulse/v1/incidents/{incident_id}")
async def get_incident(incident_id: str):
    try:
        resp = await es.get(index=INDEX_INCIDENTS, id=incident_id)
        return serialize_incident(resp["_source"], fallback_id=resp.get("_id"))
    except Exception:
        raise HTTPException(status_code=404, detail="Incident not found")

@app.get("/api/datapulse/v1/incidents")
async def list_incidents(
    page: int = 1,
    page_size: int = 20,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    if page < 1:
        raise HTTPException(status_code=400, detail="page must be >= 1")
    if page_size < 1 or page_size > 100:
        raise HTTPException(status_code=400, detail="page_size must be between 1 and 100")
    if sort_order not in {"asc", "desc"}:
        raise HTTPException(status_code=400, detail="sort_order must be either 'asc' or 'desc'")

    filters = []
    if severity:
        filters.append({"term": {"severity.keyword": severity}})
    if status:
        filters.append({"term": {"status.keyword": status}})

    query = {"bool": {"filter": filters}} if filters else {"match_all": {}}
    start = (page - 1) * page_size

    try:
        resp = await es.search(
            index=INDEX_INCIDENTS,
            from_=start,
            size=page_size,
            query=query,
            sort=[{sort_by: {"order": sort_order, "missing": "_last"}}],
            track_total_hits=True,
        )
    except Exception as e:
        logger.error(f"Failed to list incidents: {e}")
        raise HTTPException(status_code=500, detail="Failed to list incidents")

    hits = resp.get("hits", {})
    total_hits = hits.get("total", {})
    total = total_hits.get("value", 0) if isinstance(total_hits, dict) else int(total_hits)
    records = [
        serialize_incident(hit.get("_source", {}), fallback_id=hit.get("_id"))
        for hit in hits.get("hits", [])
    ]

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "records": records,
    }

@app.post("/agent/report")
async def receive_report(report: AgentReport, background_tasks: BackgroundTasks):
    logger.info(f"Received report from {report.agent} for {report.incident_id}")
    
    # 1. Update Incident in ES
    update_doc = {}
    
    if report.agent == "analyst":
        update_doc["analyst_report"] = report.rcca
    elif report.agent == "resolver":
        update_doc["resolver_proposals"] = report.proposals
    
    try:
        await es.update(index=INDEX_INCIDENTS, id=report.incident_id, doc=update_doc)
        logger.info(f"Updated incident {report.incident_id} with {report.agent} report")
    except Exception as e:
        logger.error(f"Failed to update incident: {e}")

    # 2. Orchestration Logic
    if report.agent == "analyst":
        background_tasks.add_task(trigger_resolver, report.incident_id, report.rcca)
    elif report.agent == "resolver" and report.proposals:
        # Send action approval requests to Slack
        background_tasks.add_task(send_action_approvals, report.incident_id, report.proposals)

    return {"status": "processed"}

@app.post("/api/datapulse/v1/incidents/{incident_id}/actions/{action_id}/approve")
async def approve_action(
    incident_id: str,
    action_id: str,
    x_user_id: Optional[str] = Header(default="system"),
):
    try:
        resp = await es.get(index=INDEX_INCIDENTS, id=incident_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Incident not found")
    except Exception as e:
        logger.error(f"Failed to fetch incident for approval: {e}")
        raise HTTPException(status_code=500, detail="Failed to process approval")

    incident_doc = resp.get("_source", {})
    proposals = incident_doc.get("resolver_proposals") or []
    proposal = _find_action(proposals, action_id)

    if not proposal:
        raise HTTPException(status_code=404, detail="Action not found")

    if proposal.get("status") == "approved":
        raise HTTPException(status_code=409, detail="Action already approved")

    timestamp = datetime.now().isoformat()
    approved_by = x_user_id or "system"

    proposal["status"] = "approved"
    proposal["approved_by"] = approved_by
    proposal["approved_at"] = timestamp

    approvals = incident_doc.get("action_approvals") or []
    approvals.append(
        {
            "incident_id": incident_id,
            "action_id": action_id,
            "status": "approved",
            "approved_by": approved_by,
            "timestamp": timestamp,
        }
    )

    try:
        await es.update(
            index=INDEX_INCIDENTS,
            id=incident_id,
            doc={
                "resolver_proposals": proposals,
                "action_approvals": approvals,
            },
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Incident not found")
    except Exception as e:
        logger.error(f"Failed to persist action approval: {e}")
        raise HTTPException(status_code=500, detail="Failed to persist approval")

    return {
        "incident_id": incident_id,
        "action_id": action_id,
        "status": "approved",
        "approved_by": approved_by,
        "timestamp": timestamp,
    }

@app.post("/api/datapulse/v1/webhook/integrations/slack")
async def slack_webhook(request: Request, x_slack_signature: Optional[str] = Header(None)):
    """Handle Slack interactive button callbacks"""
    body = await request.body()
    
    # Validate Slack signature
    if not verify_slack_signature(body, x_slack_signature, request.headers):
         logger.warning("Invalid Slack signature - blocking unauthorized request")
         raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Parse Slack payload
    form_data = await request.form()
    payload_str = form_data.get("payload", "{}")
    payload = json.loads(payload_str)
    
    # Extract action value: "approve|INC-XXX|ACTION-YYY"
    actions = payload.get("actions", [])
    if not actions:
        return {"status": "no_action"}
    
    action_value = actions[0].get("value", "")
    parts = action_value.split("|")
    
    if len(parts) >= 3:
        action_type, incident_id, action_id = parts[0], parts[1], parts[2]

        if not action_id:
            logger.warning(f"Received Slack action callback without action_id for incident {incident_id}")
            return {"status": "invalid_action"}

        if action_type in {"approve", "reject"}:
            logger.info(f"Received {action_type} for action {action_id} incident {incident_id}")
            await persist_action_decision(incident_id, action_id, action_type, payload)

    return {"status": "processed"}


async def persist_action_decision(incident_id: str, action_id: str, decision: str, payload: Dict[str, Any]):
    """Persist Slack approval decisions for auditable action tracing."""
    actor = payload.get("user", {}).get("id")
    decision_doc = {
        "event_type": "action_decision",
        "incident_id": incident_id,
        "action_id": action_id,
        "decision": decision,
        "actor": actor,
        "source": "slack",
        "recorded_at": datetime.now().isoformat(),
    }

    try:
        await es.index(
            index=INDEX_AUDIT,
            id=f"{incident_id}:{action_id}",
            document=decision_doc,
        )
        logger.info(
            f"Persisted {decision} decision for incident={incident_id} action={action_id}"
        )
    except Exception as e:
        logger.error(f"Failed to persist action decision for {incident_id}/{action_id}: {e}")

def verify_slack_signature(body: bytes, signature: str, headers: Dict[str, str]) -> bool:
    """Implement Slack signature verification using HMAC-SHA256"""
    signing_secret = os.getenv("SLACK_SIGNING_SECRET")
    if not signing_secret:
        logger.warning("SLACK_SIGNING_SECRET not set - skipping validation (INSECURE)")
        return True
    
    timestamp = headers.get("X-Slack-Request-Timestamp")
    if not timestamp:
        return False
        
    # Prevent replay attacks
    if abs(int(timestamp) - int(datetime.now().timestamp())) > 60 * 5:
        return False
        
    sig_basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
    req_hash = hmac.new(
        signing_secret.encode('utf-8'),
        sig_basestring.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    expected_signature = f"v0={req_hash}"
    return hmac.compare_digest(expected_signature, signature)

# --- Helpers ---

async def notify_integrations(incident: Dict[str, Any]):
    """Send notifications to Slack and create Jira ticket"""
    slack = get_slack_adapter()
    jira = get_jira_adapter()
    
    if slack:
        try:
            await slack.send_incident_alert(incident)
        except Exception as e:
            logger.error(f"Slack notification failed: {e}")
    
    if jira:
        try:
            ticket_key = await jira.create_incident_ticket(incident)
            if ticket_key:
                # Update incident with Jira ticket key
                await es.update(
                    index=INDEX_INCIDENTS,
                    id=incident["incident_id"],
                    doc={"jira_ticket": ticket_key}
                )
                logger.info(f"Attached Jira ticket {ticket_key} to {incident['incident_id']}")
        except Exception as e:
            logger.error(f"Jira ticket creation failed: {e}")

async def send_action_approvals(incident_id: str, proposals: List[Dict[str, Any]]):
    """Send action approval requests to Slack"""
    slack = get_slack_adapter()
    if not slack:
        return
    
    for proposal in proposals:
        if proposal.get("requires_approval"):
            try:
                await slack.send_action_approval_request(incident_id, proposal)
            except Exception as e:
                logger.error(f"Failed to send approval request: {e}")

async def trigger_analyst(incident_id, service, detected_at):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{ANALYST_URL}/run", json={
                "incident_id": incident_id,
                "service": service,
                "detected_at": detected_at
            }, timeout=30.0)
    except Exception as e:
        logger.error(f"Failed to trigger analyst: {e}")

async def trigger_resolver(incident_id, rcca_context):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{RESOLVER_URL}/run", json={
                "incident_id": incident_id,
                "rcca_context": rcca_context
            }, timeout=30.0)
    except Exception as e:
        logger.error(f"Failed to trigger resolver: {e}")

@app.get("/healthz")
def health():
    return {"status": "ok"}

@app.get("/metrics")
async def metrics():
    """Real-time metrics endpoint for DataPulse monitoring"""
    try:
        count_resp = await es.count(index=INDEX_INCIDENTS)
        total_incidents = count_resp.get("count", 0)
        return {
            "incidents_total": total_incidents,
            "agents_status": "healthy",
            "active_agents": 3,
            "es_connected": True,
            "last_captured": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Metrics collection failed: {e}")
        return {"incidents_total": -1, "es_connected": False}
