import os
import json
import hashlib
import httpx
from elasticsearch import AsyncElasticsearch
from loguru import logger

ES_HOST = os.getenv("ES_HOST", "http://elasticsearch:9200")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")

es = AsyncElasticsearch(hosts=[ES_HOST])

async def resolve_incident(incident_id: str, rcca_context: dict):
    # Support both old and new data contracts
    hypotheses = rcca_context.get("hypotheses", [])
    root_cause = rcca_context.get("root_cause", "")
    full_analysis = rcca_context.get("full_analysis", "")

    if not hypotheses and not root_cause:
        logger.warning(f"No analysis context for {incident_id}, skipping resolution.")
        return

    # Extract search query
    if hypotheses:
        top_hypothesis = hypotheses[0]
        cause = top_hypothesis.get("cause", "")
        description = top_hypothesis.get("description", "")
        query = f"{cause} {description}"
    else:
        # New structure
        query = root_cause
        top_hypothesis = {"cause": root_cause, "description": full_analysis[:200]}

    # Search for runbooks
    runbooks = await search_runbooks(query)
    
    # Synthesize Actions
    actions = synthesize_actions(incident_id, runbooks, top_hypothesis)

    
    # Report Proposals
    await submit_proposals(incident_id, actions)

async def search_runbooks(query_text: str):
    """
    Search for runbooks using ES|QL with basic sanitization.
    Future: Integrate with Elastic Inference API for ELSER/Vector search.
    """
    # Basic sanitization for ES|QL
    safe_query = query_text.replace('"', '\\"')
    
    esql_query = f"""
    FROM runbooks-knowledge 
    | WHERE MATCH(content, "{safe_query}") OR MATCH(title, "{safe_query}")
    | LIMIT 5 
    | KEEP title, url, content, runbook_id
    """
    results = []
    try:
        resp = await es.esql.query(query=esql_query, format="json")
        if resp.get("values"):
            cols = [c["name"] for c in resp["columns"]]
            for row in resp["values"]:
                results.append(dict(zip(cols, row)))
    except Exception as e:
        logger.error(f"Error searching runbooks: {e}")
        # Fallback to standard search if ES|QL fails
        try:
            search_resp = await es.search(
                index="runbooks-knowledge",
                query={"multi_match": {"query": query_text, "fields": ["title", "content"]}}
            )
            for hit in search_resp["hits"]["hits"]:
                results.append(hit["_source"])
        except Exception as es_err:
            logger.error(f"Fallback search also failed: {es_err}")
            
    return results

def generate_action_id(incident_id: str, action: dict, sequence: int) -> str:
    """Generate a deterministic action ID for auditability across systems."""
    canonical_action = json.dumps(action, sort_keys=True, default=str)
    digest_input = f"{incident_id}|{sequence}|{canonical_action}".encode("utf-8")
    digest = hashlib.sha256(digest_input).hexdigest()[:16].upper()
    return f"ACT-{digest}"


def synthesize_actions(incident_id, runbooks, hypothesis):
    actions = []
    cause = (hypothesis.get("cause") or "").lower()
    description = (hypothesis.get("description") or "").lower()
    
    # More robust heuristic based on keywords
    if any(k in cause or k in description for k in ["deploy", "version", "rollout", "update"]):
        actions.append({
            "action_type": "rollback",
            "title": "Rollback to Previous Version",
            "description": "Perform an automated rollback to the last known-good container version.",
            "estimated_time": "5m",
            "requires_approval": True,
            "risk_score": 0.2
        })
    
    if any(k in cause or k in description for k in ["db", "database", "connection", "pool", "timeout"]):
        actions.append({
            "action_type": "scale_up",
            "title": "Increase Connection Pool",
            "description": "Increase the database connection pool size via ConfigMap update.",
            "estimated_time": "2m",
            "requires_approval": True,
            "risk_score": 0.1
        })

    if any(k in cause or k in description for k in ["cpu", "memory", "load", "latency", "spike"]):
        actions.append({
            "action_type": "scale_out",
            "title": "Horizontal Scale Out",
            "description": "Increase replica count by 1 to handle traffic spike.",
            "estimated_time": "3m",
            "requires_approval": False, # Low risk for auto-approval
            "risk_score": 0.05
        })
    
    # Attach runbook links as informational actions
    for r in runbooks:
        actions.append({
            "action_type": "documentation",
            "title": f"Runbook: {r.get('title', 'Reference Guide')}",
            "description": "Manual remediation guide from knowledge base.",
            "url": r.get("url"),
            "requires_approval": False,
            "risk_score": 0.0
        })
        
    for idx, action in enumerate(actions):
        action["action_id"] = generate_action_id(incident_id, action, idx)

    return actions

async def submit_proposals(incident_id, actions):
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "incident_id": incident_id,
                "agent": "resolver",
                "proposals": actions
            }
            # Posting to API Gateway agent reporting endpoint
            await client.post(f"{API_GATEWAY_URL}/agent/report", json=payload)
    except Exception as e:
        logger.error(f"Failed to submit proposals: {e}")
