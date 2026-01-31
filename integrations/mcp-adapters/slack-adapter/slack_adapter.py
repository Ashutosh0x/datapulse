"""
Slack Integration Adapter for DataPulse
"""
import os
import httpx
from loguru import logger
from typing import Dict, Any, List


class SlackAdapter:
    def __init__(self):
        self.webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
        self.bot_token = os.getenv("SLACK_BOT_TOKEN", "")
        self.channel = os.getenv("SLACK_CHANNEL", "#incident-alerts")
    
    async def send_incident_alert(self, incident: Dict[str, Any]):
        """Send incident alert to Slack channel"""
        blocks = self._build_incident_blocks(incident)
        
        await self._post_message(self.channel, blocks)
    
    async def send_action_approval_request(self, incident_id: str, action: Dict[str, Any]):
        """Send action approval request with interactive buttons"""
        blocks = self._build_approval_blocks(incident_id, action)
        
        await self._post_message(self.channel, blocks)
    
    def _build_incident_blocks(self, incident: Dict[str, Any]) -> List[Dict]:
        """Build Slack Block Kit blocks for incident alert"""
        severity_prefix = {"critical": "[CRITICAL]", "high": "[HIGH]", "medium": "[MEDIUM]"}. get(
            incident.get("severity", "medium"), "[INFO]"
        )
        
        metrics = incident.get("metrics", {})
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{severity_prefix} Incident Detected: {incident['service']}"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Incident ID:*\n{incident['incident_id']}"},
                    {"type": "mrkdwn", "text": f"*Severity:*\n{incident['severity'].upper()}"},
                    {"type": "mrkdwn", "text": f"*Error Rate:*\n{metrics.get('error_rate', 0):.2%}"},
                    {"type": "mrkdwn", "text": f"*P99 Latency:*\n{metrics.get('p99_latency_ms', 0):.0f}ms"}
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Detected by Sentinel at {incident.get('detected_at', 'N/A')}"
                    }
                ]
            }
        ]
        
        return blocks
    
    def _build_approval_blocks(self, incident_id: str, action: Dict[str, Any]) -> List[Dict]:
        """Build Slack Block Kit blocks for action approval"""
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "Action Approval Required"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Action:* {action.get('action_type', 'Unknown')}\n*Incident:* {incident_id}\n*Description:* {action.get('description', 'N/A')}\n*ETA:* {action.get('estimated_time', 'N/A')}"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Approve"},
                        "style": "primary",
                        "value": f"approve|{incident_id}|{action.get('action_id')}"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Reject"},
                        "style": "danger",
                        "value": f"reject|{incident_id}|{action.get('action_id')}"
                    }
                ]
            }
        ]
        
        return blocks
    
    async def _post_message(self, channel: str, blocks: List[Dict]):
        """Post message to Slack using webhook or bot token"""
        if self.webhook_url:
            await self._post_via_webhook(blocks)
        elif self.bot_token:
            await self._post_via_api(channel, blocks)
        else:
            logger.warning("No Slack credentials configured")
    
    async def _post_via_webhook(self, blocks: List[Dict]):
        """Post using webhook URL"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json={"blocks": blocks},
                    timeout=10.0
                )
                if response.status_code == 200:
                    logger.info("Slack message sent via webhook")
                else:
                    logger.error(f"Slack webhook error: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to send Slack message: {e}")
    
    async def _post_via_api(self, channel: str, blocks: List[Dict]):
        """Post using Slack API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://slack.com/api/chat.postMessage",
                    json={"channel": channel, "blocks": blocks},
                    headers={"Authorization": f"Bearer {self.bot_token}"},
                    timeout=10.0
                )
                data = response.json()
                if data.get("ok"):
                    logger.info("Slack message sent via API")
                else:
                    logger.error(f"Slack API error: {data.get('error')}")
        except Exception as e:
            logger.error(f"Failed to send Slack message: {e}")
