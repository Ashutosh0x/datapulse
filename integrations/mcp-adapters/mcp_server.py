"""DataPulse MCP Server with plugin support.

Exposes built-in Slack/Jira tools via the Model Context Protocol (MCP) and can
load extra tools from lightweight JSON plugin manifests.
"""

import asyncio
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

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


@dataclass
class PluginTool:
    """Runtime representation of a plugin tool manifest entry."""

    plugin_id: str
    name: str
    description: str
    input_schema: dict[str, Any]
    response_text: str


PLUGIN_DIR = Path(os.getenv("MCP_PLUGIN_DIR", Path(__file__).parent / "plugins"))


def _normalize_tool_name(tool_name: str) -> str:
    return tool_name.strip().lower().replace(" ", "_")


def load_plugin_tools() -> dict[str, PluginTool]:
    """Load plugin tools from JSON manifests in the plugins directory."""
    plugin_tools: dict[str, PluginTool] = {}

    if not PLUGIN_DIR.exists():
        logger.info(f"MCP plugin directory does not exist: {PLUGIN_DIR}")
        return plugin_tools

    for manifest_path in sorted(PLUGIN_DIR.glob("*.json")):
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning(f"Skipping unreadable plugin manifest {manifest_path.name}: {exc}")
            continue

        plugin_id = manifest.get("plugin_id") or manifest_path.stem
        tools = manifest.get("tools", [])

        if not isinstance(tools, list) or not tools:
            logger.warning(f"Plugin {plugin_id} has no tools and was skipped")
            continue

        for tool in tools:
            tool_name = tool.get("name")
            if not tool_name:
                logger.warning(f"Plugin {plugin_id} has a tool with missing name")
                continue

            normalized_name = _normalize_tool_name(tool_name)
            scoped_name = f"{plugin_id}.{normalized_name}"

            plugin_tools[scoped_name] = PluginTool(
                plugin_id=plugin_id,
                name=scoped_name,
                description=tool.get("description", f"{plugin_id} tool: {normalized_name}"),
                input_schema=tool.get("inputSchema", {"type": "object", "properties": {}}),
                response_text=tool.get(
                    "responseText",
                    f"Plugin tool {scoped_name} executed successfully.",
                ),
            )

    logger.info(f"Loaded {len(plugin_tools)} plugin tools from {PLUGIN_DIR}")
    return plugin_tools


PLUGIN_TOOLS = load_plugin_tools()

server = Server("datapulse-tools")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available incident response tools."""
    built_in_tools = [
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

    plugin_tools = [
        types.Tool(
            name=plugin_tool.name,
            description=plugin_tool.description,
            inputSchema=plugin_tool.input_schema,
        )
        for plugin_tool in PLUGIN_TOOLS.values()
    ]

    return built_in_tools + plugin_tools

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

    elif name in PLUGIN_TOOLS:
        plugin_tool = PLUGIN_TOOLS[name]
        logger.info(f"MCP Call: plugin tool {name} from plugin {plugin_tool.plugin_id}")
        return [types.TextContent(type="text", text=plugin_tool.response_text)]

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
