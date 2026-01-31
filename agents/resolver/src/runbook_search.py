import os
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
    actions = synthesize_actions(runbooks, top_hypothesis)

    
    # Report Proposals
    await submit_proposals(incident_id, actions)

async def search_runbooks(query_text: str):
    # ES|QL Search or Text Search
    # Using simple text search via ES|QL as per tool def, or standard search if needed for vectors
    # Let's match the tool definition conceptually: FROM runbooks-knowledge...
    esql_query = f"""
    FROM runbooks-knowledge 
    | WHERE MATCH(content, "{query_text}") 
    | LIMIT 3 
    | KEEP title, url, content
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
    return results

def synthesize_actions(runbooks, hypothesis):
    actions = []
    
    # Heuristic based on hypothesis type
    if "Deployment" in hypothesis.get("cause", ""):
        actions.append({
            "action_type": "rollback",
            "title": "Rollback Deployment",
            "description": "Rollback the service to the previous specific version.",
            "estimated_time": "5m",
            "requires_approval": True
        })
    elif "Database" in hypothesis.get("cause", "") or "Connection" in hypothesis.get("description", ""):
         actions.append({
            "action_type": "scale_up",
            "title": "Increase DB Connection Pool",
            "description": "Update config map to increase pool size by 50%.",
            "estimated_time": "2m",
            "requires_approval": True
        })
    
    # Always attach runbook links
    for r in runbooks:
        actions.append({
            "action_type": "documentation",
            "title": "Read Runbook: " + r.get("title", "Unknown"),
            "url": r.get("url"),
            "requires_approval": False
        })
        
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
