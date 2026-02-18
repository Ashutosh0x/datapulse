# DataPulse: Autonomous AI-Driven Incident Response

## Problem Statement
Incident Response (IR) today is brittle and manual. When a production spike occurs, engineers spend the first 30-60 minutes manually correlating logs, checking deployment histories, and searching for internal runbooks across disconnected wikis. This manual "triage lag" increases Mean Time to Resolution (MTTR) and business risk.

## The Solution: DataPulse
DataPulse is an end-to-end autonomous agentic system built on the **Elastic Stack**. It automates the entire IR loop:
1. **Detection (Sentinel Agent)**: Uses ES|QL to detect anomalies in real-time telemetry.
2. **Analysis (Analyst Agent)**: Leverages **Elastic Agent Builder** to perform multi-step RCA by correlating logs and deployments using semantic reasoning.
3. **Resolution (Resolver Agent)**: Uses **ES|QL** and **Elastic Workflows** to discover remediation steps in a knowledge base and trigger automated fixes.

## Key Features & Elastic Integration
- **Elastic Agent Builder**: Our Analyst Agent uses the native Agent Builder API to orchestrate tools, capturing the LLM's full `reasoning` process directly into our audit indices.
- **ES|QL-Native Precision**: The Resolver Agent searches for runbooks using ES|QL, allowing for complex filtered retrieval that standard vector search alone might miss.
- **Human-in-the-Loop (HITL)**: High-risk actions (like rollbacks) are gated behind an approval state machine integrated with **Slack Block Kit** and **Elastic UI**.
- **Measurable Impact Dashboard**: A custom Command Center (React/EUI) that calculates "Time Saved" by agents for every incident.

## Impact
DataPulse reduces the triage phase from ~45 minutes to **under 2 minutes**. By automating the "search and correlate" sludge, it allows on-call engineers to focus on decision-making rather than data retrieval.

## Challenges & Learnings
- **Challenge**: Handling the lack of a Rust toolchain in serverless build environments for Python dependencies (Pydantic v2).
- **Solution**: We implemented a strategic downgrade to Pydantic v1.10 and pinned Python 3.11 to ensure high-fidelity binary compatibility on Vercel.
- **What we loved**: The **Agent Builder's** native tool invocation logs made debugging the "thought process" of our agents significantly easier than using raw OpenAI traces.

## Open Source Repository
[GitHub: Ashutosh0x/datapulse](https://github.com/Ashutosh0x/datapulse)
*(Licensed under Apache 2.0)*
