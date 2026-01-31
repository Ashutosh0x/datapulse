# DataPulse System Architecture

## Overview

DataPulse is a multi-agent AI system for automated incident response and root cause analysis, built on Elasticsearch observability data.

## Architecture Diagram

```

                        Frontend Layer                            
                             
   React/EUI App   Kibana Plugin           
                             

             HTTP/REST
            

                       API Gateway Layer                          
     
    FastAPI Gateway                                            
    - Authentication & RBAC                                    
    - Request routing                                           
    - Integration orchestration                                
     

                                      
           Async HTTP                  Webhooks
                                      
  
   Agent Layer                Integrations           
      
  Sentinel                 Slack Adapter         
  - Anomaly Detection      - Block Kit messages  
  - ES|QL queries          - Interactive btns    
      
                                                     
      
  Analyst                  Jira Adapter          
  - Log correlation        - Ticket creation     
  - Deployment check       - Status updates      
  - RCA synthesis          
                              
                             
      PagerDuty Adapter     
  Resolver                 (Future)              
  - Runbook search         
  - Action proposal      
  

         ES|QL / Index API
        

                    Data & Storage Layer                      
   
                Elasticsearch Cluster                       
           
     Observability    Incidents       Lookup        
     Indices          Index           Tables        
                                                    
     logs-*          incidents       lookup-        
     metrics-*                       services       
     traces-*                                       
     deployments-*                                  
           
                                                           
                          
     Runbooks        Agent Audit                      
     (w/ vectors)    Logs                             
                          
   
                                                             
   
                Redis (Session/Cache)                       
   

```

## Component Details

### 1. Agents

#### Sentinel Agent
- **Role**: Continuous monitoring and anomaly detection
- **Tools**: `detect_anomalies` ES|QL tool
- **Triggers**: Time-based (60s interval) or on-demand
- **Output**: Incident creation payload with metrics and evidence

**Key Logic**:
```python
for service in MONITORED_SERVICES:
    metrics = run_esql_query(detect_anomalies, service)
    if metrics.error_rate > threshold or metrics.latency > threshold:
        create_incident(service, metrics)
```

#### Analyst Agent
- **Role**: Root Cause Analysis
- **Tools**: `correlate_error_logs`, `check_recent_deployments`
- **Input**: Incident ID + service name
- **Output**: RCA report with timeline, hypotheses, confidence scores

**Key Logic**:
```python
logs = query_error_logs(service, time_window)
deployments = query_deployments(service, time_window)
hypothesis = generate_hypothesis(logs, deployments)
return RCA(timeline, hypotheses, evidence)
```

#### Resolver Agent
- **Role**: Remediation guidance
- **Tools**: `search_runbooks`
- **Input**: RCA context
- **Output**: Action proposals (rollback, scale, config change)

**Key Logic**:
```python
runbooks = semantic_search(hypothesis.cause)
actions = synthesize_actions(runbooks, hypothesis)
return proposals_requiring_approval(actions)
```

### 2. API Gateway

Central orchestration point:
- **Incident Management**: CRUD operations on incidents
- **Agent Coordination**: Triggers agents in sequence (Sentinel → Analyst → Resolver)
- **Integration Proxy**: Routes to Slack/Jira adapters
- **Webhook Handler**: Processes Slack button clicks

**Flow**:
```
POST /incidents
  > Save to ES
  > Notify Slack/Jira
  > Trigger Analyst
       > Trigger Resolver
            > Send approval requests to Slack
```

### 3. Integrations

#### Slack Adapter
- **Capabilities**:
  - Send rich incident alerts (Block Kit)
  - Interactive approval buttons
  - Webhook callback handling
- **Security**: Validates request signatures

#### Jira Adapter
- **Capabilities**:
  - Create incident tickets
  - Update status and add comments
  - Link incidents to Jira keys in ES

### 4. Data Layer

#### Elasticsearch Indices

| Index Pattern | Purpose | Key Fields |
|--------------|---------|-----------|
| `metrics-system` | System metrics | service, error_count, latency, @timestamp |
| `logs-application` | App logs | service, log.level, message, error.type |
| `deployments-*` | Deployment events | service, version, author, description |
| `lookup-services` | Service metadata | service, team, criticality, on_call |
| `runbooks-knowledge` | Runbooks (w/ vectors) | title, content, content_embedding |
| `incidents` | Incident records | incident_id, status, metrics, timeline |
| `agent-audit-*` | Audit trail | agent, action, decision, timestamp |

#### ES|QL Tools

Four custom tools registered with Agent Builder:
1. **detect_anomalies**: Computes error rate & P99 latency, filters by thresholds, enriches with LOOKUP JOIN
2. **correlate_error_logs**: Aggregates top errors for a service
3. **check_recent_deployments**: Finds recent deployments that may correlate with incident
4. **search_runbooks**: Text or k-NN search on runbooks index

### 5. Frontend

**Tech Stack**:
- React 18 + TypeScript
- Elastic EUI (design system)
- Elastic Charts
- Axios (API client)

**Key Views**:
- **Dashboard**: Current incident summary with metrics
- **RCA Flyout**: Timeline and hypothesis display
- **Resolver Flyout**: Action proposals with approval buttons

**Design Principles**:
- Dark mode by default
- Semantic colors only (danger, warning, primary)
- 24px grid spacing
- Tight, data-dense layout
- No custom CSS overrides

## Data Flow: End-to-End Incident Lifecycle

```
1. [Sentinel] runs detect_anomalies every 60s
   ↓
2. Anomaly detected: payment-service error_rate = 12%
   ↓
3. [Sentinel] POST /api/datapulse/v1/incidents
   ↓
4. [API Gateway] saves incident to ES, triggers integrations
   ↓
5. [Slack] sends alert: "[CRITICAL] CRITICAL: payment-service 12% error rate"
6. [Jira] creates ticket: OPS-1234
   ↓
7. [API Gateway] triggers Analyst agent
   ↓
8. [Analyst] runs correlate_error_logs + check_deployments
   - Finds: 847 DatabaseConnectionTimeout errors
   - Finds: Deployment v2.4.1 by @john 45min ago
   ↓
9. [Analyst] generates hypothesis:
   - Cause: "Deployment caused connection exhaustion"
   - Confidence: 92%
   ↓
10. [Analyst] POST /agent/report (RCA to Gateway)
   ↓
11. [API Gateway] updates incident.analyst_report, triggers Resolver
   ↓
12. [Resolver] searches runbooks for "database connection pool"
   ↓
13. [Resolver] proposes actions:
   - Rollback to v2.3.9 (ETA 5min, requires approval)
   - Increase pool size (ETA 2min, requires approval)
   ↓
14. [Resolver] POST /agent/report (proposals to Gateway)
   ↓
15. [API Gateway] sends approval requests to Slack
   ↓
16. [Slack] shows buttons: "Approve Rollback" | "Reject"
   ↓
17. User clicks "Approve Rollback"
   ↓
18. [Slack] POST /webhook/integrations/slack
   ↓
19. [API Gateway] logs approval, executes action (stub)
   ↓
20. System updated, incident marked as mitigated
```

## Security & Governance

### Authentication
- OAuth2/JWT with scopes: `incidents:read`, `incidents:write`, `actions:approve`, `tools:manage`
- Agent-to-agent auth via mTLS or workload identity

### Authorization (RBAC)
- **Viewers**: Can read incidents
- **Responders**: Can approve actions
- **Admins**: Can manage tools and configurations

### Audit Trail
All agent decisions logged to `agent-audit-*`:
```json
{
  "@timestamp": "...",
  "agent": "resolver",
  "incident_id": "INC-001",
  "action": "propose_rollback",
  "decision": {...},
  "approved_by": "user@example.com"
}
```

### Human-in-the-Loop
- All production-changing actions require explicit approval
- Approval gating enforced at API Gateway layer
- Slack interactive buttons provide UX for approval

## Scalability Considerations

### Current (Demo)
- Single-node Elasticsearch
- Direct HTTP between agents
- Synchronous orchestration

### Production (Future)
- **Event Bus**: Kafka for async agent communication
- **Horizontal Scaling**: Multiple instances of each agent behind load balancer
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Per-service quotas for agent queries
- **Distributed Tracing**: W3C Trace Context across all services

## Monitoring & Observability

### Agent Health
- `/healthz` endpoints on all services
- Prometheus metrics (`/metrics`)
- Elastic APM instrumentation

### Key Metrics
- `incidents_created_total` (by severity, service)
- `agent_run_duration_seconds` (by agent)
- `action_approval_time_seconds`
- `rca_confidence_score` (histogram)
- `integration_call_failures_total` (by adapter)

## Deployment

### Local (Docker Compose)
```bash
cd infra/local
docker-compose up
```

### Production (Kubernetes + Helm)
```bash
helm install datapulse ./infra/k8s/helm-chart \
  --set elasticsearch.host=https://es.prod.company.com \
  --set slack.webhook=... \
  --set jira.baseUrl=...
```

## Future Enhancements

1. **ML-based Anomaly Detection**: Integrate Elastic ML jobs for dynamic thresholds
2. **Semantic Runbook Search**: Use dense_vector embeddings + k-NN
3. **Auto-remediation**: Execute safe actions (scale-up, cache clear) without approval
4. **Multi-cloud**: Support AWS, GCP, Azure integrations
5. **Custom Agent Builder**: Full integration with Elastic Agent Builder API for tool registration
6. **LangChain/OpenAI**: Enhanced hypothesis generation with GPT-4

## References

- [Elastic Agent Builder Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/agent-builder.html)
- [ES|QL Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/esql.html)
- [Elastic EUI](https://elastic.github.io/eui/)
- [AIOps Best Practices](https://www.gartner.com/en/information-technology/glossary/aiops-artificial-intelligence-operations)
