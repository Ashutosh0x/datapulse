#!/usr/bin/env python3
"""
Tool Registration Script for Elastic Agent Builder

This script registers all ES|QL tools with Agent Builder API.
These tools will be available to the Incident Investigator agent.

Usage:
    export KIBANA_URL="https://your-cluster.kb.region.cloud.es.io:9243"
    export ELASTIC_API_KEY="your_api_key_here"
    python3 register_tools.py
"""

import httpx
import os
import sys
import json
from typing import List, Dict, Any


# Environment variables
KIBANA_URL = os.getenv("KIBANA_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")

if not KIBANA_URL or not ELASTIC_API_KEY:
    print("[ERROR] ERROR: Missing environment variables")
    print("   Required: KIBANA_URL, ELASTIC_API_KEY")
    print("")
    print("   Example:")
    print('   export KIBANA_URL="https://your-cluster.kb.us-east-1.aws.found.io:9243"')
    print('   export ELASTIC_API_KEY="your_agent_builder_api_key"')
    sys.exit(1)

KIBANA_URL = KIBANA_URL.rstrip('/')


# Tool definitions
TOOLS: List[Dict[str, Any]] = [
    {
        "id": "custom.detect_anomalies",
        "type": "esql",
        "description": "Detect metric anomalies for a service using statistical analysis. Returns average error rate and P99 latency.",
        "configuration": {
            "query": """FROM metrics-*
| WHERE service.name == ?service_name
| WHERE @timestamp >= NOW() - ?time_window_minutes MINUTES
| STATS avg_error_rate = AVG(error_rate), 
        p99_latency = PERCENTILE(response_time_ms, 99),
        total_requests = COUNT(*)
| WHERE avg_error_rate > 0.05 OR p99_latency > 1000""",
            "params": {
                "service_name": {
                    "type": "string",
                    "description": "Name of the service to analyze (e.g., 'auth-service')"
                },
                "time_window_minutes": {
                    "type": "integer",
                    "default": 15,
                    "description": "Time window in minutes to analyze (default: 15)"
                }
            }
        },
        "tags": ["observability", "metrics", "anomaly-detection"]
    },
    {
        "id": "custom.correlate_deployment",
        "type": "esql",
        "description": "Find deployments that occurred near the incident time. Helps correlate incidents with recent code/config changes.",
        "configuration": {
            "query": """FROM deployments-*
| WHERE service.name == ?service_name
| WHERE @timestamp >= ?start_time AND @timestamp <= ?end_time
| SORT @timestamp DESC
| LIMIT 5
| KEEP @timestamp, service.name, deployment.version, deployment.previous_version, deployment.author, deployment.commit_message""",
            "params": {
                "service_name": {
                    "type": "string",
                    "description": "Service name to check deployments for"
                },
                "start_time": {
                    "type": "date",
                    "description": "Start of time window (ISO 8601 format)"
                },
                "end_time": {
                    "type": "date",
                    "description": "End of time window (ISO 8601 format)"
                }
            }
        },
        "tags": ["deployment", "correlation", "change-tracking"]
    },
    {
        "id": "custom.search_error_logs",
        "type": "esql",
        "description": "Search for error-level logs around the incident time. Returns aggregated error counts by message.",
        "configuration": {
            "query": """FROM logs-*
| WHERE service.name == ?service_name
| WHERE log.level == "ERROR"
| WHERE @timestamp >= ?start_time AND @timestamp <= ?end_time
| STATS error_count = COUNT(*) BY message
| SORT error_count DESC
| LIMIT 10""",
            "params": {
                "service_name": {
                    "type": "string",
                    "description": "Service name to search logs for"
                },
                "start_time": {
                    "type": "date",
                    "description": "Start of time window"
                },
                "end_time": {
                    "type": "date",
                    "description": "End of time window"
                }
            }
        },
        "tags": ["logs", "errors", "investigation"]
    },
    {
        "id": "custom.check_recent_incidents",
        "type": "esql",
        "description": "Find similar recent incidents for the same service to identify patterns.",
        "configuration": {
            "query": """FROM .incidents-datapulse-*
| WHERE service == ?service_name
| WHERE detected_at >= NOW() - ?lookback_days DAYS
| SORT detected_at DESC
| LIMIT 10
| KEEP incident_id, severity, status, detected_at, resolution.root_cause""",
            "params": {
                "service_name": {
                    "type": "string",
                    "description": "Service name to search incidents for"
                },
                "lookback_days": {
                    "type": "integer",
                    "default": 30,
                    "description": "Number of days to look back (default: 30)"
                }
            }
        },
        "tags": ["incidents", "history", "pattern-detection"]
    },
    {
        "id": "custom.analyze_metric_trends",
        "type": "esql",
        "description": "Analyze metric trends over time to establish baseline and detect deviations.",
        "configuration": {
            "query": """FROM metrics-*
| WHERE service.name == ?service_name
| WHERE @timestamp >= NOW() - ?lookback_hours HOURS
| BUCKET @timestamp BY 5 minutes AS time_bucket
| STATS avg_error_rate = AVG(error_rate),
        avg_latency = AVG(response_time_ms)
  BY time_bucket
| SORT time_bucket DESC""",
            "params": {
                "service_name": {
                    "type": "string",
                    "description": "Service name"
                },
                "lookback_hours": {
                    "type": "integer",
                    "default": 2,
                    "description": "Hours of historical data to analyze"
                }
            }
        },
        "tags": ["metrics", "trends", "baseline"]
    }
]


def register_tools():
    """Register all tools with Agent Builder API."""
    
    headers = {
        "Authorization": f"ApiKey {ELASTIC_API_KEY}",
        "Content-Type": "application/json",
        "kbn-xsrf": "true"  # Required for Kibana API
    }
    
    success_count = 0
    failed_tools = []
    
    print(f"[CONFIG] Registering {len(TOOLS)} tools with Agent Builder...")
    print(f"   Kibana URL: {KIBANA_URL}")
    print("")
    
    for tool in TOOLS:
        tool_id = tool["id"]
        url = f"{KIBANA_URL}/api/agent_builder/tools"
        
        try:
            response = httpx.post(
                url,
                json=tool,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                print(f"[DONE] {tool_id}")
                success_count += 1
            else:
                print(f"[ERROR] {tool_id} - HTTP {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                failed_tools.append(tool_id)
        
        except httpx.RequestError as e:
            print(f"[ERROR] {tool_id} - Network error: {e}")
            failed_tools.append(tool_id)
        except Exception as e:
            print(f"[ERROR] {tool_id} - Unexpected error: {e}")
            failed_tools.append(tool_id)
    
    print("")
    print("="*60)
    print(f"[DONE] Successfully registered: {success_count}/{len(TOOLS)} tools")
    
    if failed_tools:
        print(f"[ERROR] Failed tools: {', '.join(failed_tools)}")
        print("")
        print("Troubleshooting:")
        print("1. Ensure Agent Builder is enabled in Kibana > Management > Stack Management")
        print("2. Verify API key has 'manage_agent_builder' privilege")
        print("3. Check if the /api/agent_builder/tools endpoint exists")
        return 1
    else:
        print("")
        print("[SUCCESS] All tools registered successfully!")
        print("")
        print("Next steps:")
        print("1. Verify tools appear in Kibana > Agent Builder > Tools")
        print(f"2. Assign tools to 'incident-investigator' agent")
        print("3. Test agent conversation with incident data")
        return 0


def list_registered_tools():
    """List all currently registered tools."""
    
    headers = {
        "Authorization": f"ApiKey {ELASTIC_API_KEY}",
        "kbn-xsrf": "true"
    }
    
    url = f"{KIBANA_URL}/api/agent_builder/tools"
    
    try:
        response = httpx.get(url, headers=headers, timeout=30.0)
        
        if response.status_code == 200:
            tools = response.json()
            print(f"\n[INFO] Currently registered tools: {len(tools)}")
            for tool in tools:
                print(f"   - {tool.get('id', 'unknown')}")
        else:
            print(f"[ERROR] Failed to list tools: HTTP {response.status_code}")
    
    except Exception as e:
        print(f"[ERROR] Error listing tools: {e}")


if __name__ == "__main__":
    exit_code = register_tools()
    
    if exit_code == 0:
        # Optionally list all tools
        if "--list" in sys.argv:
            list_registered_tools()
    
    sys.exit(exit_code)
