# DataPulse: Comprehensive System Documentation

Welcome to the full technical documentation for the DataPulse AI Incident Response platform. This guide covers setup, architecture, and operation.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Agent Configuration](#agent-configuration)
4. [Backend (API Gateway)](#backend-api-gateway)
5. [Frontend (Kibana Plugin UI)](#frontend-kibana-plugin-ui)
6. [Integrations (Slack & Jira)](#integrations-slack--jira)
7. [Elasticsearch Strategy](#elasticsearch-strategy)

---

## Prerequisites

Ensure you have the following installed locally:
- **Docker & Docker Compose**
- **Python 3.10+**
- **Node.js 18+**
- **Elasticsearch 8.17+** (Cloud or Local)
- **Slack App Token** (Optional, for notifications)
- **Jira API Token** (Optional, for ticket sync)

---

## Installation & Setup

### 1. Repository Preparation
```bash
git clone https://github.com/your-repo/datapulse.git
cd datapulse
```

### 2. Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Key variables to set:
- `ELASTIC_API_KEY`: Your primary Elastic key.
- `AGENT_BUILDER_ID`: The ID from your Elastic Agent Builder dashboard.
- `KIBANA_URL`: Your Kibana instance URL.

### 3. Start Infrastructure
Launch the containerized microservices:
```bash
docker-compose up -d --build
```
This starts: `elasticsearch`, `api-gateway`, `analyst-agent`, `resolver-agent`, and the `frontend`.

### 4. Initialize Data Schema
Run the production setup script to create ILM policies, index templates, and aliases:
```bash
./scripts/setup_elasticsearch_indices.sh
```

---

## Agent Configuration

### Analyst Agent (The Investigator)
- **Location:** `agents/analyst`
- **Logic:** Uses the `incident-investigator` persona in Agent Builder.
- **Workflow:** 
  1. Receives incident from Gateway.
  2. Executes ES|QL tool calls to find spikes.
  3. Writes reasoning logs to `.agent-conversations-*`.

### Resolver Agent (The Fixer)
- **Location:** `agents/resolver`
- **Logic:** Matches root causes to a vector-indexed knowledge base of runbooks (`runbooks-knowledge`).
- **Workflow:**
  1. Receives RCCA from Analyst.
  2. Performs Semantic Search.
  3. Proposes actions (Rollback/Up-scale).

---

## Integrations (Slack & Jira)

### Slack Setup
1. Create a Slack App in your workspace.
2. Enable "Interactivity" and set the Request URL to:
   `http://<your-gateway-url>/api/datapulse/v1/webhook/integrations/slack`
3. Add `SLACK_SIGNING_SECRET` to your `.env` to enable HMAC verification.

### Jira Setup
1. Generate an API Token from Atlassian.
2. Update the `Jira Configuration` in the DataPulse **Settings** tab.
3. Incidents will automatically generate tickets in your specified project (e.g., `OPS`).

---

## Elasticsearch Strategy

DataPulse follows the **Elastic Well-Architected Framework**:

| Index Pattern | Purpose | Lifecycle Policy |
| :--- | :--- | :--- |
| `.incidents-datapulse-*` | Core incident metadata | Rotates monthly |
| `.agent-conversations-*` | Trace of agent reasoning/tool calls | Rotates weekly |
| `.audit-datapulse-*` | Immutable log of all approved actions | Permanent (Cold tier) |
| `runbooks-knowledge` | Vector index for remediation | Static / Re-indexed on change |

---

## Development & Troubleshooting

### Viewing Logs
```bash
docker-compose logs -f api-gateway
```

### Triggering a Test Incident
```bash
curl -X POST http://localhost:8000/api/datapulse/v1/incidents \
-H "Content-Type: application/json" \
-d '{
  "source": "Sentinel",
  "service": "payment-service",
  "detected_at": "2026-01-31T12:00:00Z",
  "severity": "P1",
  "metrics": {"error_rate": 15.2, "p99_latency_ms": 1200.5},
  "evidence": [{"type": "log", "text": "Connection timeout to redis"}]
}'
```

### Common Issues
- **401 Unauthorized:** Your `ELASTIC_API_KEY` is invalid or expired. Update it in the **Security** tab.
- **Agent Timeout:** Ensure the Analyst and Resolver containers can reach the API Gateway on the Docker internal network (`http://api-gateway:8000`).

---

**For further questions, contact the DataPulse Platform team.**
