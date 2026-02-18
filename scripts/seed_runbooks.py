import os
import asyncio
import json
from datetime import datetime
from elasticsearch import AsyncElasticsearch
from loguru import logger

ES_HOST = os.getenv("ES_HOST", "http://localhost:9200")
es = AsyncElasticsearch(hosts=[ES_HOST])

SAMPLE_RUNBOOKS = [
    {
        "runbook_id": "RB-001",
        "title": "Database Connection Pool Exhaustion Recovery",
        "content": """
# Problem
Application is experiencing 'Connection Pool Exhaustion' or 'Timeout' errors.

# Recovery Steps
1. Increase the maximum connection pool size in the service configuration.
2. Check for leaking connections in the application code.
3. Scale up the database instance if CPU is high.

# Automation Tool
Tool: scale_up_db_pool
Params: { "max_connections": 100 }
        """,
        "service": {"name": "payment-service"},
        "incident_type": "database",
        "tags": ["db", "performance", "timeout"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "runbook_id": "RB-002",
        "title": "Service Rollback Procedure",
        "content": """
# Problem
High error rate detected immediately after a new deployment.

# Recovery Steps
1. Identify the previous stable version from deployments-* index.
2. Perform a rolling restart using the previous image tag.
3. Notify the engineering team on Slack.

# Automation Tool
Tool: rollback_service
Params: { "target_version": "previous" }
        """,
        "service": {"name": "auth-service"},
        "incident_type": "deployment",
        "tags": ["deployment", "rollback", "critical"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "runbook_id": "RB-003",
        "title": "Horizontal Pod Autoscaling for Traffic Spikes",
        "content": """
# Problem
Latency spikes (P99 > 500ms) due to unexpected traffic volume.

# Recovery Steps
1. Verify system load and CPU utilization.
2. Increase replica count of the affected service pods.
3. Warm up caches if necessary.

# Automation Tool
Tool: scale_out_replicas
Params: { "replicas": "+1" }
        """,
        "service": {"name": "api-gateway"},
        "incident_type": "latency",
        "tags": ["scaling", "latency", "traffic"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

async def seed_runbooks():
    logger.info(f"Connecting to Elasticsearch at {ES_HOST}...")
    
    # Ensure index exists (or use simple creation)
    index_name = "runbooks-knowledge"
    
    try:
        if not await es.indices.exists(index=index_name):
            logger.info(f"Creating index {index_name}...")
            # We assume the template or mappings are already handled by setup_elasticsearch_indices.sh
            # but we'll do a simple creation here if needed.
            await es.indices.create(index=index_name)
    except Exception as e:
        logger.error(f"Error checking/creating index: {e}")

    logger.info(f"Seeding {len(SAMPLE_RUNBOOKS)} runbooks...")
    
    for runbook in SAMPLE_RUNBOOKS:
        try:
            # Upsert by runbook_id
            await es.index(
                index=index_name,
                id=runbook["runbook_id"],
                document=runbook,
                refresh=True
            )
            logger.info(f"Indexed runbook: {runbook['title']}")
        except Exception as e:
            logger.error(f"Failed to index {runbook['runbook_id']}: {e}")

    logger.info("Runbook seeding complete!")
    await es.close()

if __name__ == "__main__":
    asyncio.run(seed_runbooks())
