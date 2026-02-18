"""
DataPulse MCP Server
Exposes Slack and Jira tools via the Model Context Protocol (MCP).
Allows Elastic Agent Builder to discover and invoke these tools dynamically.
"""

import asyncio
import os
from mcp.server.models import InitializationOptions
from mcp.server import Notification, Server
from mcp.server.stdio import stdio_server
import mcp.types as types
from loguru import logger

# Import existing adapters
import sys
sys.path.append(os.path.dirname(__file__))
from slack_adapter.slack_adapter import SlackAdapter
from jira_adapter.jira_adapter import JiraAdapter

# Initialize adapters
slack = SlackAdapter()
jira = JiraAdapter()

server = Server("datapulse-tools")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available incident response tools."""
    return [
        types.Tool(
            name="send_slack_alert",
            description="Send an incident alert to the #incident-alerts Slack channel.",
            inputSchema={
                "type": "object",
                "properties": {
                    "incident_id": {"type": "string"},
                    "service": {"type": "string"},
                    "severity": {"type": "string"},
                    "error_rate": {"type": "number"},
                },
                "required": ["incident_id", "service", "severity"],
            },
        ),
        types.Tool(
            name="create_jira_ticket",
            description="Create a Jira ticket for an ongoing incident.",
            inputSchema={
                "type": "object",
                "properties": {
                    "incident_id": {"type": "string"},
                    "service": {"type": "string"},
                    "summary": {"type": "string"},
                },
                "required": ["incident_id", "service", "summary"],
            },
        ),
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """Handle tool execution requests."""
    if not arguments:
        raise ValueError("Missing arguments")

    if name == "send_slack_alert":
        logger.info(f"MCP Call: send_slack_alert for {arguments['incident_id']}")
        await slack.send_incident_alert(arguments)
        return [types.TextContent(type="text", text="Slack alert sent successfully.")]

    elif name == "create_jira_ticket":
        logger.info(f"MCP Call: create_jira_ticket for {arguments['incident_id']}")
        key = await jira.create_incident_ticket(arguments)
        return [types.TextContent(type="text", text=f"Jira ticket created: {key}")]

    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    # Run the server using stdin/stdout streams
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="datapulse-tools",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=Notification.EMPTY,
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
