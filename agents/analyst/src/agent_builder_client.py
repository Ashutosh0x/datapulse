"""
Elastic Agent Builder API Client

This client replaces OpenAI with Elastic Agent Builder for incident analysis.
NO MOCK DATA - All responses come from real Agent Builder API.
"""

import httpx
import os
import json
from typing import Dict, Any, AsyncIterator, Optional
from loguru import logger


class AgentBuilderClient:
    """
    Client for Elastic Agent Builder Converse API.
    
    Environment Variables Required:
    - KIBANA_URL: Your Kibana URL (e.g., https://your-cluster.kb.us-east-1.aws.found.io:9243)
    - ELASTIC_API_KEY: API key with agent_builder permissions
    - ELASTIC_AGENT_ID: Agent ID (default: "incident-investigator")
    """
    
    def __init__(self):
        self.kibana_url = os.getenv("KIBANA_URL")
        self.api_key = os.getenv("ELASTIC_API_KEY")
        self.agent_id = os.getenv("ELASTIC_AGENT_ID", "incident-investigator")
        
        if not self.kibana_url:
            raise ValueError("KIBANA_URL environment variable not set")
        if not self.api_key:
            raise ValueError("ELASTIC_API_KEY environment variable not set")
        
        # Remove trailing slash
        self.kibana_url = self.kibana_url.rstrip('/')
        
        logger.info(f"Agent Builder client initialized for agent: {self.agent_id}")
    
    async def converse(
        self,
        incident_id: str,
        user_input: str,
        conversation_id: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream agent conversation using Elastic Agent Builder API.
        
        Args:
            incident_id: The incident being investigated
            user_input: Question/command for the agent
            conversation_id: Optional existing conversation ID
        
        Yields:
            Dict with structure:
            {
                "event": "reasoning" | "tool_call" | "tool_result" | "message_chunk" | "round_complete",
                "data": {...}
            }
        
        Example usage:
            async for event in client.converse("INC-123", "Investigate this incident"):
                if event["event"] == "tool_call":
                    print(f"Agent calling tool: {event['data']['tool_id']}")
                elif event["event"] == "message_chunk":
                    print(event['data']['text_chunk'], end='')
        """
        url = f"{self.kibana_url}/api/agent_builder/converse/async"
        
        payload = {
            "agent_id": self.agent_id,
            "input": user_input,
            "conversation_id": conversation_id or f"conv-{incident_id}",
            "context": {
                "incident_id": incident_id,
                "timestamp": "now"
            }
        }
        
        headers = {
            "Authorization": f"ApiKey {self.api_key}",
            "Content-Type": "application/json",
            "kbn-xsrf": "true"  # Required for Kibana API
        }
        
        logger.info(f"Starting Agent Builder conversation for incident {incident_id}")
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Agent Builder API error: {response.status_code} - {error_text}")
                        raise Exception(f"Agent Builder API failed: {response.status_code}")
                    
                    current_event = None
                    
                    async for line in response.aiter_lines():
                        line = line.strip()
                        
                        if not line:
                            continue
                        
                        if line.startswith("event:"):
                            current_event = line.split(":", 1)[1].strip()
                        
                        elif line.startswith("data:"):
                            data_str = line.split(":", 1)[1].strip()
                            
                            try:
                                data = json.loads(data_str)
                                
                                yield {
                                    "event": current_event,
                                    "data": data
                                }
                                
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse SSE data: {e}")
                                continue
        
        except httpx.RequestError as e:
            logger.error(f"Network error during Agent Builder conversation: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during Agent Builder conversation: {e}")
            raise
    
    async def get_conversation_history(self, conversation_id: str) -> Dict[str, Any]:
        """
        Retrieve full conversation history.
        
        Args:
            conversation_id: The conversation ID
        
        Returns:
            Dict containing all conversation rounds
        """
        url = f"{self.kibana_url}/api/agent_builder/conversations/{conversation_id}"
        
        headers = {
            "Authorization": f"ApiKey {self.api_key}",
            "kbn-xsrf": "true"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    
    def format_incident_query(self, incident_id: str, service: str, detected_at: str) -> str:
        """
        Format the initial query sent to the agent.
        
        Args:
            incident_id: Incident ID
            service: Service name
            detected_at: Detection timestamp
        
        Returns:
            Formatted query string
        """
        return f"""Investigate incident {incident_id} for service '{service}' detected at {detected_at}.

Please:
1. Correlate with recent deployments (check deployments-* index)
2. Search for error logs around the detection time (logs-* index)
3. Analyze metric anomalies (if available)
4. Identify the root cause with confidence score
5. Recommend remediation steps

Use the ES|QL tools to query real data. Provide evidence for all conclusions."""


# Singleton instance
_client_instance = None


def get_agent_builder_client() -> AgentBuilderClient:
    """Get singleton Agent Builder client instance."""
    global _client_instance
    if _client_instance is None:
        _client_instance = AgentBuilderClient()
    return _client_instance
