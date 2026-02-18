import os
import httpx
from datetime import datetime
from loguru import logger
from typing import Dict, Any, Optional

class WorkflowAdapter:
    """
    Adapter for triggering Elastic Workflows (Elastic-native automation).
    """
    def __init__(self):
        self.kibana_url = os.getenv("KIBANA_URL", "").rstrip('/')
        self.api_key = os.getenv("ELASTIC_API_KEY", "")
        self.workflow_mode = os.getenv("WORKFLOW_MODE", "mock").lower()
        
    async def trigger_remediation(self, incident_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger a specific workflow based on the action type.
        """
        action_type = action.get("action_type", "unknown")
        logger.info(f"Triggering workflow for {action_type} on incident {incident_id}")
        
        if self.workflow_mode == "mock":
            return await self._mock_workflow_run(incident_id, action)
            
        return await self._trigger_elastic_flow(incident_id, action)

    async def _trigger_elastic_flow(self, incident_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actually trigger a flow in Elastic Workflows.
        """
        if not self.kibana_url or not self.api_key:
            logger.warning("Elastic Workflow credentials missing, falling back to mock.")
            return await self._mock_workflow_run(incident_id, action)
            
        # Standard Elastic Workflow (Flows) API endpoint
        url = f"{self.kibana_url}/api/flows/v1/execute"
        
        payload = {
            "flow_id": f"flow-{action.get('action_type', 'default')}",
            "input": {
                "incident_id": incident_id,
                "action_id": action.get("action_id"),
                "params": action.get("params", {}),
                "actor": "datapulse-agent"
            }
        }
        
        headers = {
            "Authorization": f"ApiKey {self.api_key}",
            "Content-Type": "application/json",
            "kbn-xsrf": "true"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Successfully triggered Elastic Workflow: {data.get('execution_id')}")
                    return {
                        "status": "triggered",
                        "execution_id": data.get("execution_id"),
                        "source": "elastic_flows"
                    }
                else:
                    logger.error(f"Failed to trigger Elastic Workflow: {response.status_code} - {response.text}")
                    return {"status": "failed", "error": response.text}
        except Exception as e:
            logger.error(f"Error calling Elastic Flow API: {e}")
            return {"status": "error", "message": str(e)}

    async def _mock_workflow_run(self, incident_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate a successful workflow execution.
        """
        logger.info(f"[MOCK WORKFLOW] Executing {action['action_type']} for {incident_id}")
        return {
            "status": "completed",
            "execution_id": f"mock-exec-{datetime.now().timestamp()}",
            "source": "mock_engine",
            "logs": [
                f"Validating state for incident {incident_id}",
                f"Starting {action['action_type']} orchestrated step",
                "Action successful"
            ]
        }

def get_workflow_adapter():
    return WorkflowAdapter()
