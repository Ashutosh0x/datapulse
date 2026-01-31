import os
import httpx
from elasticsearch import AsyncElasticsearch
from loguru import logger
import json
from datetime import datetime

ES_HOST = os.getenv("ES_HOST", "http://elasticsearch:9200")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")

es = AsyncElasticsearch(hosts=[ES_HOST])

# In a real app, load this from the tools/esql/detect_anomalies.json file
ANOMALY_QUERY_TEMPLATE = """
FROM metrics-system 
| WHERE service.name == "{service_name}" AND @timestamp > NOW() - {time_window} 
| STATS error_rate = AVG(CAST(error_count AS DOUBLE)) / COUNT(*), p99_latency = PERCENTILE(latency, 99) BY service.name 
| WHERE error_rate > {error_threshold} OR p99_latency > {latency_threshold}
| LOOKUP lookup-services ON service.name
| KEEP service.name, error_rate, p99_latency, team, criticality
"""

SERVICES_TO_MONITOR = ["payment-service", "auth-service", "cart-service"]

async def run_anomaly_detection_cycle():
    """
    Iterates through monitored services and checks for anomalies.
    """
    for service in SERVICES_TO_MONITOR:
        await check_service(service)

async def check_service(service_name: str):
    logger.debug(f"Checking service: {service_name}")
    
    # Fill params
    query = ANOMALY_QUERY_TEMPLATE.format(
        service_name=service_name,
        time_window="15m",
        error_threshold=0.05,
        latency_threshold=1000
    )
    
    try:
        # Execute ES|QL
        # Note: ES|QL API in python client might be under `es.esql.query` or direct transport
        # For 8.11+, use es.esql.query
        resp = await es.esql.query(query=query, format="json")
        
        # Parse results
        # ES|QL JSON response format: columns, values (list of lists)
        columns = resp.get("columns", [])
        values = resp.get("values", [])
        
        if values:
            logger.warning(f"Anomaly detected for {service_name}! Data: {values}")
            await report_incident(service_name, columns, values[0])
            
    except Exception as e:
        logger.error(f"Failed to query ES for {service_name}: {e}")

async def report_incident(service, columns, row):
    """
    Constructs incident payload and calls API Gateway.
    Row is a list of values corresponding to columns.
    """
    # Map columns to dict
    col_names = [c["name"] for c in columns]
    data = dict(zip(col_names, row))
    
    payload = {
        "source": "sentinel",
        "service": service,
        "detected_at": datetime.now().isoformat(), 
        "severity": "high" if data.get("criticality") == "high" else "medium",
        "metrics": {
            "error_rate": data.get("error_rate"),
            "p99_latency_ms": data.get("p99_latency")
        },
        "evidence": [
            {"type": "metric", "ref": f"metrics-system:service={service}"},
            {"type": "note", "text": f"Threshold violation detected. Team: {data.get('team')}"}
        ],
        "correlation_id": f"autodetect-{service}-{datetime.now().timestamp()}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{API_GATEWAY_URL}/api/datapulse/v1/incidents", json=payload)
            if resp.status_code == 201:
                logger.info(f"Incident reported successfully: {resp.json().get('incident_id')}")
            else:
                logger.error(f"Failed to report incident: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to call API Gateway: {e}")
