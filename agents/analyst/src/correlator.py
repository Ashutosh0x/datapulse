"""
RCA Correlator using Elastic Agent Builder

This module replaces mock/rule-based RCA with real Agent Builder analysis.
NO MOCK DATA - Uses Agent Builder tools to query real Elasticsearch data.
"""

import os
from datetime import datetime
from typing import Dict, Any, List
from loguru import logger
from elasticsearch import AsyncElasticsearch
import httpx

from .agent_builder_client import get_agent_builder_client


# Elasticsearch client
ES_HOST = os.getenv("ES_HOST", "http://elasticsearch:9200")
es = AsyncElasticsearch(hosts=[ES_HOST])

# API Gateway URL for reporting back
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://api-gateway:8000")


async def run_rca_investigation(incident_id: str, service: str, detected_at: str):
    """
    Run Root Cause Analysis investigation using Elastic Agent Builder.
    
    This function:
    1. Streams agent conversation using Agent Builder API
    2. Collects all tool calls and results
    3. Logs conversation to .agent-conversations-* index
    4. Sends final RCA report back to API Gateway
    
    Args:
        incident_id: The incident ID to investigate
        service: Service name (e.g., "auth-service")
        detected_at: ISO timestamp when incident was detected
    
    Returns:
        None (sends report to API Gateway asynchronously)
    """
    logger.info(f"Starting RCA investigation for {incident_id} using Agent Builder")
    
    try:
        # Get Agent Builder client
        agent_client = get_agent_builder_client()
        
        # Format the query
        user_query = agent_client.format_incident_query(incident_id, service, detected_at)
        
        # Stream conversation
        conversation_rounds = []
        current_round = {
            "round_number": 1,
            "input": {"message": user_query, "timestamp": datetime.now().isoformat()},
            "steps": [],
            "response": {}
        }
        
        step_number = 0
        final_message = ""
        final_confidence = 0.0
        
        async for event in agent_client.converse(incident_id, user_query):
            event_type = event["event"]
            data = event["data"]
            
            if event_type == "reasoning":
                step_number += 1
                current_round["steps"].append({
                    "step_number": step_number,
                    "type": "reasoning",
                    "reasoning": data.get("reasoning", ""),
                    "timestamp": datetime.now().isoformat()
                })
                logger.info(f"[Reasoning] {data.get('reasoning', '')[:100]}...")
            
            elif event_type == "tool_call":
                step_number += 1
                tool_call_step = {
                    "step_number": step_number,
                    "type": "tool_call",
                    "tool_id": data.get("tool_id"),
                    "params": data.get("params", {}),
                    "timestamp": datetime.now().isoformat()
                }
                current_round["steps"].append(tool_call_step)
                logger.info(f"[Tool Call] {data.get('tool_id')} with params {data.get('params')}")
            
            elif event_type == "tool_result":
                # Find the corresponding tool_call step and add results
                for step in reversed(current_round["steps"]):
                    if step["type"] == "tool_call" and "results" not in step:
                        step["results"] = data.get("results", [])
                        step["execution_time_ms"] = data.get("execution_time_ms", 0)
                        break
                logger.info(f"[Tool Result] Received {len(data.get('results', []))} results")
            
            elif event_type == "message_chunk":
                text_chunk = data.get("text_chunk", "")
                final_message += text_chunk
                logger.debug(f"[Message Chunk] {text_chunk}")
            
            elif event_type == "round_complete":
                round_data = data.get("round", {})
                final_confidence = round_data.get("confidence", 0.85)
                current_round["response"] = {
                    "message": final_message,
                    "confidence": final_confidence,
                    "timestamp": datetime.now().isoformat()
                }
                conversation_rounds.append(current_round)
                logger.info(f"[Round Complete] Confidence: {final_confidence}")
        
        # Save conversation to Elasticsearch
        conversation_doc = {
            "conversation_id": f"conv-{incident_id}",
            "agent_id": "incident-investigator",
            "agent_version": "v1.0.0",
            "incident_id": incident_id,
            "user": {
                "username": "system",
                "roles": ["agent"]
            },
            "rounds": conversation_rounds,
            "created_at": detected_at,
            "completed_at": datetime.now().isoformat()
        }
        
        index_name = f".agent-conversations-{datetime.now().strftime('%Y.%m')}"
        await es.index(index=index_name, document=conversation_doc)
        logger.info(f"Saved conversation to {index_name}")
        
        # Extract RCA from final message
        rcca = extract_rcca_from_response(final_message, final_confidence, conversation_rounds)
        
        # Send report to API Gateway
        await send_report_to_gateway(incident_id, rcca)
        
        logger.info(f"RCA investigation complete for {incident_id}")
    
    except Exception as e:
        logger.error(f"RCA investigation failed for {incident_id}: {e}")
        # Send error report
        await send_error_report(incident_id, str(e))


def extract_rcca_from_response(
    message: str,
    confidence: float,
    rounds: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Extract structured RCA from agent response.
    
    Args:
        message: Final agent message
        confidence: Confidence score
        rounds: All conversation rounds
    
    Returns:
        Structured RCA dict
    """
    # Collect evidence from tool results
    evidence = []
    
    for round_data in rounds:
        for step in round_data.get("steps", []):
            if step["type"] == "tool_result" and "results" in step:
                for result in step["results"]:
                    if isinstance(result, dict) and "data" in result:
                        evidence.append({
                            "type": "tool_result",
                            "tool_id": step.get("tool_id"),
                            "snippet": str(result["data"])[:200]
                        })
    
    return {
        "root_cause": message[:500],  # First 500 chars as summary
        "full_analysis": message,
        "confidence": confidence,
        "evidence": evidence,
        "tool_calls_count": len([s for r in rounds for s in r.get("steps", []) if s["type"] == "tool_call"]),
        "timestamp": datetime.now().isoformat()
    }


async def send_report_to_gateway(incident_id: str, rcca: Dict[str, Any]):
    """
    Send RCA report back to API Gateway.
    
    Args:
        incident_id: Incident ID
        rcca: Root cause analysis results
    """
    url = f"{GATEWAY_URL}/agent/report"
    
    payload = {
        "incident_id": incident_id,
        "agent": "analyst",
        "timestamp": datetime.now().isoformat(),
        "rcca": rcca
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Sent RCA report to API Gateway for {incident_id}")
    except Exception as e:
        logger.error(f"Failed to send report to API Gateway: {e}")


async def send_error_report(incident_id: str, error: str):
    """Send error report if RCA fails."""
    await send_report_to_gateway(
        incident_id,
        {
            "error": error,
            "root_cause": "Agent investigation failed",
            "confidence": 0.0,
            "evidence": []
        }
    )
