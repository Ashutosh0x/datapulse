#!/bin/bash

# DataPulse Elasticsearch Index Setup Script
# NO MOCK DATA - This creates real index templates for production use

ES_HOST="${ES_HOST:-http://localhost:9200}"

echo "[PRODUCTION] Setting up DataPulse Elasticsearch indices..."
echo "Elasticsearch Host: $ES_HOST"
echo ""

# Test ES connection
echo "Testing Elasticsearch connection..."
if ! curl -s "$ES_HOST/_cluster/health" > /dev/null; then
    echo "[ERROR] ERROR: Cannot connect to Elasticsearch at $ES_HOST"
    echo "   Make sure Elasticsearch is running: docker-compose up -d elasticsearch"
    exit 1
fi
echo "[DONE] Elasticsearch is reachable"
echo ""

# 1. Incidents Index Template
echo "Creating .incidents-datapulse-* index template..."
curl -X PUT "$ES_HOST/_index_template/incidents_datapulse_template" \
  -H 'Content-Type: application/json' \
  -d'{
  "index_patterns": [".incidents-datapulse-*"],
  "template": {
    "settings": {
      "index": {
        "number_of_shards": 1,
        "number_of_replicas": 1,
        "lifecycle.name": "incidents_policy"
      }
    },
    "mappings": {
      "properties": {
        "incident_id": { "type": "keyword" },
        "severity": { "type": "keyword" },
        "status": { "type": "keyword" },
        "title": { "type": "text" },
        "service": { "type": "keyword" },
        "detected_at": { "type": "date" },
        "created_at": { "type": "date" },
        "assigned_to": { "type": "keyword" },
        "integrations": {
          "properties": {
            "slack": {
              "properties": {
                "channel": { "type": "keyword" },
                "thread_ts": { "type": "keyword" }
              }
            },
            "jira": {
              "properties": {
                "ticket_key": { "type": "keyword" },
                "status": { "type": "keyword" }
              }
            }
          }
        },
        "agent_conversations": { "type": "keyword" },
        "resolution": {
          "properties": {
            "root_cause": { "type": "text" },
            "resolved_at": { "type": "date" },
            "resolution_time_seconds": { "type": "integer" },
            "resolved_by": { "type": "keyword" }
          }
        },
        "evidence": {
          "type": "nested",
          "properties": {
            "type": { "type": "keyword" },
            "ref": { "type": "keyword" },
            "snippet": { "type": "text" }
          }
        },
        "metrics": {
          "properties": {
            "error_rate": { "type": "float" },
            "p99_latency_ms": { "type": "float" }
          }
        }
      }
    }
  }
}' && echo " [DONE]" || echo " [ERROR]"

# 2. Agent Conversations Index
echo "Creating .agent-conversations-* index template..."
curl -X PUT "$ES_HOST/_index_template/agent_conversations_template" \
  -H 'Content-Type: application/json' \
  -d'{
  "index_patterns": [".agent-conversations-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "conversations_policy",
      "index.number_of_shards": 1
    },
    "mappings": {
      "properties": {
        "conversation_id": { "type": "keyword" },
        "agent_id": { "type": "keyword" },
        "agent_version": { "type": "keyword" },
        "incident_id": { "type": "keyword" },
        "user": {
          "properties": {
            "username": { "type": "keyword" },
            "roles": { "type": "keyword" }
          }
        },
        "rounds": {
          "type": "nested",
          "properties": {
            "round_number": { "type": "integer" },
            "input": {
              "properties": {
                "message": { "type": "text" },
                "timestamp": { "type": "date" }
              }
            },
            "steps": {
              "type": "nested",
              "properties": {
                "step_number": { "type": "integer" },
                "type": { "type": "keyword" },
                "reasoning": { "type": "text" },
                "tool_id": { "type": "keyword" },
                "params": { "type": "object", "enabled": false },
                "results": { "type": "object", "enabled": false },
                "execution_time_ms": { "type": "integer" },
                "timestamp": { "type": "date" }
              }
            },
            "response": {
              "properties": {
                "message": { "type": "text" },
                "confidence": { "type": "float" },
                "timestamp": { "type": "date" }
              }
            }
          }
        },
        "created_at": { "type": "date" },
        "completed_at": { "type": "date" }
      }
    }
  }
}' && echo " [DONE]" || echo " [ERROR]"

# 3. Audit Log Index
echo "Creating .audit-datapulse-* index template..."
curl -X PUT "$ES_HOST/_index_template/audit_datapulse_template" \
  -H 'Content-Type: application/json' \
  -d'{
  "index_patterns": [".audit-datapulse-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "audit_policy",
      "index.number_of_shards": 1
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "event_id": { "type": "keyword" },
        "agent_id": { "type": "keyword" },
        "incident_id": { "type": "keyword" },
        "user": { "type": "keyword" },
        "action": { "type": "keyword" },
        "target": {
          "properties": {
            "type": { "type": "keyword" },
            "id": { "type": "keyword" }
          }
        },
        "details": {
          "properties": {
            "from_version": { "type": "keyword" },
            "to_version": { "type": "keyword" },
            "confidence": { "type": "float" },
            "evidence": { "type": "keyword" }
          }
        },
        "approval_status": { "type": "keyword" },
        "approved_by": { "type": "keyword" },
        "approved_at": { "type": "date" },
        "execution_status": { "type": "keyword" },
        "execution_duration_ms": { "type": "integer" },
        "error": { "type": "text" }
      }
    }
  }
}' && echo " [DONE]" || echo " [ERROR]"

# 4. Deployments Index
echo "Creating deployments-* index template..."
curl -X PUT "$ES_HOST/_index_template/deployments_template" \
  -H 'Content-Type: application/json' \
  -d'{
  "index_patterns": ["deployments-*"],
  "template": {
    "settings": {
      "index.number_of_shards": 1
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "service": {
          "properties": {
            "name": { "type": "keyword" },
            "environment": { "type": "keyword" }
          }
        },
        "deployment": {
          "properties": {
            "version": { "type": "keyword" },
            "previous_version": { "type": "keyword" },
            "author": { "type": "keyword" },
            "commit_sha": { "type": "keyword" },
            "commit_message": { "type": "text" },
            "diff_url": { "type": "keyword" }
          }
        },
        "change_description": { "type": "text" },
        "change_type": { "type": "keyword" }
      }
    }
  }
}' && echo " [DONE]" || echo " [ERROR]"

# 5. Runbooks Knowledge Base
echo "Creating runbooks-knowledge index..."
curl -X PUT "$ES_HOST/runbooks-knowledge" \
  -H 'Content-Type: application/json' \
  -d'{
  "mappings": {
    "properties": {
      "runbook_id": { "type": "keyword" },
      "title": { "type": "text" },
      "content": { "type": "text" },
      "content_embedding": {
        "type": "dense_vector",
        "dims": 384,
        "index": true,
        "similarity": "cosine"
      },
      "service": {
        "properties": {
          "name": { "type": "keyword" }
        }
      },
      "incident_type": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}' && echo " [DONE]" || echo " [ERROR]"

echo ""
echo "[SUCCESS] All index templates created successfully!"
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/generate_synthetic_logs.py"
echo "  2. Configure Filebeat and restart: docker-compose up -d filebeat"
echo "  3. Verify data: curl $ES_HOST/logs-*/_count"
