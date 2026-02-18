# DataPulse Hackathon Next Steps Plan

## Goal
Maximize scoring against the Elastic AI Agent Builder Hackathon criteria by closing the last implementation gaps with demo-safe deliverables.

## Priority 1 (Week 1): Make remediation execution real

### 1) Elastic Workflows integration (highest impact)
**Gap:** Resolver actions are approved but not executed through Elastic-native orchestration.

**Implementation plan:**
- Add `integrations/workflows/elastic_workflow_client.py` to call Kibana flow APIs (`/api/flows/...`) using API key auth.
- Add `integrations/workflows/trigger_workflow.py` as a CLI + callable adapter for gateway usage.
- Update gateway approval handler to map approved action -> workflow id -> trigger payload.
- Keep current execution stub as fallback behind a feature flag (`WORKFLOWS_ENABLED=false`).

**Demo acceptance criteria:**
- Approve action in UI -> workflow trigger call visible in logs.
- Persist workflow run id/status in `incidents` and `agent-audit-*`.
- Show one successful run in Kibana during demo.

---

## Priority 2 (Week 1): Zero-config resolver experience

### 2) Seed runbooks automatically
**Gap:** Fresh clone has no `runbooks-knowledge` data, so Resolver cannot find remediation steps.

**Implementation plan:**
- Add `data/runbooks/sample_runbooks.json` with 8-10 realistic runbooks.
- Add `scripts/seed_runbooks.py`:
  - creates index/mapping if missing,
  - bulk ingests sample runbooks,
  - optionally generates embeddings when model endpoint exists.
- Call `python scripts/seed_runbooks.py` from `scripts/setup_elasticsearch_indices.sh`.
- Add idempotency (upsert by runbook id).

**Demo acceptance criteria:**
- One command bootstrap creates indices and seeds runbooks.
- Resolver returns at least 3 relevant runbooks for a seeded incident scenario.

---

## Priority 3 (Week 2): Formal MCP server interface

### 3) Promote adapters to MCP servers
**Gap:** `mcp-adapters` are currently Python modules, not discoverable MCP servers.

**Implementation plan:**
- Add `integrations/mcp_servers/slack_server.py` and `jira_server.py` using `mcp[cli]`.
- Expose tools: `send_incident_alert`, `post_approval_message`, `create_jira_issue`, `add_jira_comment`.
- Add server manifests/config for local discovery.
- Update Resolver/Gateway integration path to call MCP tools.

**Demo acceptance criteria:**
- MCP inspection shows registered Slack/Jira tools.
- Resolver can invoke at least one remediation communication tool via MCP.

---

## Priority 4 (Week 2): Submission artifacts for judges

### 4) Final narrative + demo production
**Gap:** Submission-ready narrative/video not finalized.

**Implementation plan:**
- Keep this file as baseline narrative draft and convert to final ~400-word submission text.
- Record a 3-minute demo with this sequence:
  1. Sentinel incident detection,
  2. Analyst reasoning + tool calls,
  3. Resolver ES|QL runbook selection,
  4. HITL approval,
  5. Workflow execution evidence,
  6. KPI panel (time saved/confidence).
- Add a short “Judge Runbook” section in README with exact commands.

**Demo acceptance criteria:**
- Video includes both Agent Builder reasoning traces and measurable KPI outcomes.
- A new evaluator can run bootstrap + demo path in <15 minutes.

---

## Suggested execution order
1. Implement Workflows trigger path.
2. Implement seed data automation.
3. Convert Slack/Jira to MCP servers.
4. Finalize narrative + demo recording.

## Risk controls
- Keep stubs as fallback to avoid demo blockers.
- Add environment toggles for optional components.
- Add smoke checks for each milestone before merging.

## Definition of done
- Approved remediation triggers real workflow execution.
- Resolver works out-of-the-box after bootstrap.
- At least one integration is demonstrably MCP-native.
- Submission package includes polished narrative + video.
