import os
import sys
sys.path.append(os.path.dirname(__file__) + "/../../../integrations/mcp-adapters")

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Header
from pydantic import BaseModel
from elasticsearch import AsyncElasticsearch
from loguru import logger
import httpx
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import hashlib
import hmac
from enum import Enum

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
            from slack_adapter import slack_adapter
            _slack_adapter = slack_adapter.SlackAdapter()
        except Exception as e:
            logger.warning(f"Slack adapter not available: {e}")
    return _slack_adapter

def get_jira_adapter():
    global _jira_adapter
    if _jira_adapter is None:
        try:
            from jira_adapter import jira_adapter
            _jira_adapter = jira_adapter.JiraAdapter()
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


class ActionState(str, Enum):
    proposed = "proposed"
    approved = "approved"
    rejected = "rejected"
    executed = "executed"
    failed = "failed"


ALLOWED_ACTION_TRANSITIONS = {
    ActionState.proposed: {ActionState.approved, ActionState.rejected},
    ActionState.approved: {ActionState.executed, ActionState.failed},
    ActionState.rejected: set(),
    ActionState.executed: set(),
    ActionState.failed: set(),
}


class ActionTransitionRequest(BaseModel):
    actor: str
    source: str = "ui"
    reason: Optional[str] = None

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
        logger.info(f"Created incident {incident_id} in {INDEX_INCIDENTS}")
    except Exception as e:
        logger.error(f"Failed to save incident: {e}")
    
    # 2. Trigger integrations  
    background_tasks.add_task(notify_integrations, doc)
    
    # 3. Trigger Analyst
    background_tasks.add_task(trigger_analyst, incident_id, req.service, req.detected_at)
    
    return {"incident_id": incident_id, "status": "open"}

@app.get("/api/datapulse/v1/incidents/{incident_id}")
async def get_incident(incident_id: str):
    try:
        resp = await es.get(index=INDEX_INCIDENTS, id=incident_id)
        return resp["_source"]
    except Exception:
        raise HTTPException(status_code=404, detail="Incident not found")

@app.post("/agent/report")
async def receive_report(report: AgentReport, background_tasks: BackgroundTasks):
    logger.info(f"Received report from {report.agent} for {report.incident_id}")
    
    # 1. Update Incident in ES
    update_doc = {}
    
    if report.agent == "analyst":
        update_doc["analyst_report"] = report.rcca
    elif report.agent == "resolver":
        normalized_actions = build_actions_from_proposals(report.incident_id, report.proposals or [])
        update_doc["resolver_proposals"] = report.proposals
        update_doc["actions"] = normalized_actions
    
    try:
        await es.update(index=INDEX_INCIDENTS, id=report.incident_id, body={"doc": update_doc})
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


@app.get("/api/datapulse/v1/incidents/{incident_id}/actions")
async def get_incident_actions(incident_id: str):
    incident = await get_incident_or_404(incident_id)
    return {
        "incident_id": incident_id,
        "actions": incident.get("actions", []),
    }


@app.get("/api/datapulse/v1/incidents/{incident_id}/actions/history")
async def get_incident_action_history(incident_id: str):
    incident = await get_incident_or_404(incident_id)
    return {
        "incident_id": incident_id,
        "history": incident.get("action_history", []),
    }


@app.post("/api/datapulse/v1/incidents/{incident_id}/actions/{action_id}/approve")
async def approve_action(incident_id: str, action_id: str, req: ActionTransitionRequest):
    return await transition_action(
        incident_id=incident_id,
        action_id=action_id,
        to_state=ActionState.approved,
        actor=req.actor,
        source=req.source,
        reason=req.reason,
    )


@app.post("/api/datapulse/v1/incidents/{incident_id}/actions/{action_id}/reject")
async def reject_action(incident_id: str, action_id: str, req: ActionTransitionRequest):
    return await transition_action(
        incident_id=incident_id,
        action_id=action_id,
        to_state=ActionState.rejected,
        actor=req.actor,
        source=req.source,
        reason=req.reason,
    )

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
    
    import json
    payload = json.loads(payload_str)
    
    # Extract action value: "approve|INC-XXX|ACTION-YYY"
    actions = payload.get("actions", [])
    if not actions:
        return {"status": "no_action"}
    
    action_value = actions[0].get("value", "")
    parts = action_value.split("|")
    
    if len(parts) >= 3:
        action_type, incident_id, action_id = parts[0], parts[1], parts[2]
        
        actor = payload.get("user", {}).get("username") or payload.get("user", {}).get("name") or "slack-user"
        if action_type == "approve":
            logger.info(f"Approving action {action_id} for incident {incident_id}")
            await transition_action(
                incident_id=incident_id,
                action_id=action_id,
                to_state=ActionState.approved,
                actor=actor,
                source="slack_webhook",
            )
        elif action_type == "reject":
            logger.info(f"Rejecting action {action_id} for incident {incident_id}")
            await transition_action(
                incident_id=incident_id,
                action_id=action_id,
                to_state=ActionState.rejected,
                actor=actor,
                source="slack_webhook",
            )
        
    return {"status": "processed"}

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
                    body={"doc": {"jira_ticket": ticket_key}}
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


def build_actions_from_proposals(incident_id: str, proposals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    actions = []
    for idx, proposal in enumerate(proposals, start=1):
        action_id = proposal.get("action_id") or f"ACT-{idx:03d}"
        now = utc_now_iso()
        actions.append({
            "action_id": action_id,
            "incident_id": incident_id,
            "state": ActionState.proposed.value,
            "title": proposal.get("title"),
            "action_type": proposal.get("action_type"),
            "description": proposal.get("description"),
            "estimated_time": proposal.get("estimated_time"),
            "requires_approval": proposal.get("requires_approval", False),
            "created_at": now,
            "updated_at": now,
            "last_actor": "resolver-agent",
        })
    return actions


async def get_incident_or_404(incident_id: str) -> Dict[str, Any]:
    try:
        resp = await es.get(index=INDEX_INCIDENTS, id=incident_id)
        return resp.get("_source", {})
    except Exception:
        raise HTTPException(status_code=404, detail="Incident not found")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def transition_action(
    incident_id: str,
    action_id: str,
    to_state: ActionState,
    actor: str,
    source: str,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    incident = await get_incident_or_404(incident_id)
    actions = incident.get("actions", [])
    action = next((item for item in actions if item.get("action_id") == action_id), None)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    current_state = ActionState(action.get("state", ActionState.proposed.value))
    allowed_states = ALLOWED_ACTION_TRANSITIONS.get(current_state, set())
    if to_state not in allowed_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_state.value} to {to_state.value}",
        )

    now = utc_now_iso()
    event = {
        "incident_id": incident_id,
        "action_id": action_id,
        "from_state": current_state.value,
        "to_state": to_state.value,
        "actor": actor,
        "source": source,
        "reason": reason,
        "timestamp": now,
    }

    for candidate in actions:
        if candidate.get("action_id") == action_id:
            candidate["state"] = to_state.value
            candidate["updated_at"] = now
            candidate["last_actor"] = actor
            break

    history = incident.get("action_history", [])
    history.append(event)

    await es.update(
        index=INDEX_INCIDENTS,
        id=incident_id,
        body={"doc": {"actions": actions, "action_history": history}},
    )
    await write_audit_event(event)

    return {
        "status": "ok",
        "incident_id": incident_id,
        "action_id": action_id,
        "state": to_state.value,
    }


async def write_audit_event(event: Dict[str, Any]):
    doc_id = f"{event['incident_id']}-{event['action_id']}-{event['timestamp']}"
    await es.index(
        index=INDEX_AUDIT,
        id=doc_id,
        document={
            "event_type": "action_state_transition",
            **event,
        },
    )

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

