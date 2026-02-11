"""
Jira Integration Adapter for DataPulse
"""
import os
import httpx
from loguru import logger
from typing import Dict, Any


class JiraAdapter:
    def __init__(self):
        self.base_url = os.getenv("JIRA_BASE_URL", "")
        self.email = os.getenv("JIRA_EMAIL", "")
        self.api_token = os.getenv("JIRA_API_TOKEN", "")
        self.project_key = os.getenv("JIRA_PROJECT_KEY", "OPS")
    
    async def create_incident_ticket(self, incident: Dict[str, Any]) -> str:
        """Create a Jira ticket for an incident"""
        
        # Map severity to Jira priority
        priority_map = {
            "critical": "Highest",
            "high": "High",
            "medium": "Medium",
            "low": "Low"
        }
        
        priority = priority_map.get(incident.get("severity", "medium"), "Medium")
        
        metrics = incident.get("metrics", {})
        
        description = f"""
*Incident Auto-Created by DataPulse*

*Incident ID:* {incident['incident_id']}
*Service:* {incident['service']}
*Detected At:* {incident.get('detected_at', 'N/A')}

*Metrics:*
- Error Rate: {metrics.get('error_rate', 0):.2%}
- P99 Latency: {metrics.get('p99_latency_ms', 0):.0f}ms

*Evidence:*
{self._format_evidence(incident.get('evidence', []))}

*Status:* Investigating
        """.strip()
        
        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": f"[DataPulse] {incident['service']} - {incident.get('severity', 'medium').upper()} incident",
                "description": description,
                "issuetype": {"name": "Incident"},
                "priority": {"name": priority}
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/rest/api/3/issue",
                    json=payload,
                    auth=(self.email, self.api_token),
                    timeout=15.0
                )
                
                if response.status_code == 201:
                    data = response.json()
                    ticket_key = data.get("key")
                    logger.info(f"Created Jira ticket: {ticket_key}")
                    return ticket_key
                else:
                    logger.error(f"Failed to create Jira ticket: {response.status_code} {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error creating Jira ticket: {e}")
            return None
    
    async def update_ticket(self, ticket_key: str, update: Dict[str, Any]):
        """Update existing Jira ticket"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/rest/api/3/issue/{ticket_key}",
                    json={"fields": update},
                    auth=(self.email, self.api_token),
                    timeout=15.0
                )
                
                if response.status_code == 204:
                    logger.info(f"Updated Jira ticket: {ticket_key}")
                    return True
                else:
                    logger.error(f"Failed to update Jira ticket: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Error updating Jira ticket: {e}")
            return False
    
    async def add_comment(self, ticket_key: str, comment: str):
        """Add comment to Jira ticket"""
        payload = {"body": comment}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/rest/api/3/issue/{ticket_key}/comment",
                    json=payload,
                    auth=(self.email, self.api_token),
                    timeout=15.0
                )
                
                if response.status_code == 201:
                    logger.info(f"Added comment to {ticket_key}")
                    return True
                else:
                    logger.error(f"Failed to add comment: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Error adding comment: {e}")
            return False
    
    def _format_evidence(self, evidence: list) -> str:
        """Format evidence list for Jira description"""
        if not evidence:
            return "No evidence available"
        
        lines = []
        for i, ev in enumerate(evidence, 1):
            ev_type = ev.get("type", "unknown")
            text = ev.get("text") or ev.get("ref") or "N/A"
            lines.append(f"{i}. [{ev_type}] {text}")
        
        return "\n".join(lines)
