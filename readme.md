# DataPulse: AI-Driven Autonomous Incident Response

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=00ecb9)](https://www.elastic.co/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**DataPulse** is a next-generation "Human-in-the-Loop" incident response platform built for the **Elastic Hackathon**. It leverages the **Elastic Agent Builder**, **ES|QL**, and **Semantic Search** to transform raw logs into actionable remediation strategies autonomously.


https://github.com/user-attachments/assets/514958f9-fac0-499f-921e-061b939ce70b


---

## Key Features

- **Autonomous Investigation:** Uses Elastic's Agent Builder to conduct deep RCA (Root Cause Analysis) using real tool calls (logs, metrics, and traces).
- **Remediation Strategies:** A specialized "Resolver" agent suggests actions (Rollbacks, Scaling, Config changes) based on observed failures.
- **Multi-Channel Orchestration:** Bi-directional sync with **Slack** and **Jira**. Approve production changes directly from Slack buttons.
- **SRE Command Center:** A premium Kibana-integrated UI featuring real-time incident tracking, agent "thought logs," and personalized operational impact metrics.
- **Security-First:** HMAC-verified Slack webhooks, RBAC visibility, and session management integrated out of the box.

---

## Technical Architecture

```mermaid
graph TD
    subgraph "User Interface"
        UI["React & @elastic/eui Plugin"]
    end

    subgraph "Orchestration & Gateway"
        Gateway["API Gateway (FastAPI)"]
        Verify["HMAC Signature Verification"]
    end

    subgraph "Intelligent Agents"
        Sentinel["Sentinel Agent (Monitoring)"]
        Analyst["Analyst Agent (RCA)"]
        Resolver["Resolver Agent (Remediation)"]
    end

    subgraph "Elastic Cloud Core"
        ES[("Elasticsearch Storage")]
        Builder["Agent Builder (Inference)"]
        ESQL["ES|QL Tool Execution"]
        ELSER["ELSER v2 (Vector Search)"]
    end

    subgraph "Integrations"
        Slack["Slack (Interactive Alerts)"]
        Jira["Jira (Lifecycle Sync)"]
    end

    %% Connections
    Sentinel -- "Anomaly Detected" --> Gateway
    Gateway -- "Store Metadata" --> ES
    Gateway -- "Trigger RCA" --> Analyst
    Analyst -- "Inference Request" --> Builder
    Builder -- "Query Logs/Metrics" --> ESQL
    ESQL -- "Aggregations" --> ES
    Analyst -- "RCCA Report" --> Gateway
    Gateway -- "Match Runbooks" --> Resolver
    Resolver -- "Vector Search" --> ELSER
    ELSER -- "Retrieve" --> ES
    Resolver -- "Propose Action" --> Gateway
    Gateway -- "Approval Gating" --> Slack
    Gateway -- "Incident Sync" --> Jira
    Gateway -- "Real-time State" --> UI
```

DataPulse is built on a distributed agent architecture:

1.  **Sentinel (Detector):** High-frequency log analysis to detect anomalies.
2.  **API Gateway (Orchestrator):** The central nervous system handling ES persistence and agent routing.
3.  **Analyst Agent (The Brain):** Leverages **Agent Builder** to query ES|QL and synthesize the root cause.
4.  **Resolver Agent (The Fixer):** Connects RCA findings to runbook-based resolutions via **Semantic Search (ELSER)**.
5.  **MCP Adapters:** Standardized connectors for third-party SaaS (Slack, Jira).

---

## Tech Stack

- **Inference & AI:** Elastic Agent Builder, ES|QL, ELSER v2.
- **Backend:** Python 3.10+, FastAPI, Loguru, Pydantic, Httpx.
- **Frontend:** React, `@elastic/eui` (Elastic UI), LocalStorage persistence.
- **Storage:** Elasticsearch 8.17+ (ILM, Search Templates, Vector Search).
- **Infrastructure:** Docker Compose, Bash automation.

---

## Quick Start

```bash
# 1. Setup Environment
cp .env.example .env

# 2. Start the DataPulse stack
docker-compose up -d

# 3. Initialize Elasticsearch Indices
./scripts/setup_elasticsearch_indices.sh

# 4. Generate Synthetic Trailing Logs
python data/generator/generate_data.py
```

Visit the UI at `http://localhost:3000` (or within your Kibana custom app frame).

---

## Documentation

For full setup guides, agent configuration, and integration tutorials, see:
**[FULL DOCUMENTATION GUIDE](./docs/FULL_DOCUMENTATION.md)**

---

## Roadmap

- [ ] RAG-based runbook generation.
- [ ] Adaptive agent personality based on user trust score.
- [ ] Multi-region incident correlation.

*Built for the Elastic Hackathon 2026.*

