"""
Synthetic data generator for DataPulse demo
Generates realistic observability data: logs, metrics, deployments
"""
import random
import time
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch
import os

ES_HOST = os.getenv("ES_HOST", "http://localhost:9200")
es = Elasticsearch(hosts=[ES_HOST])

SERVICES = ["payment-service", "auth-service", "cart-service", "notification-service"]
TEAMS = {"payment-service": "payments-team", "auth-service": "security-team", 
         "cart-service": "checkout-team", "notification-service": "platform-team"}
ERROR_TYPES = ["DatabaseConnectionTimeout", "HTTPConnectionError", "ValidationError", 
               "NullPointerException", "TimeoutException"]


def generate_metrics(num_records=1000, inject_anomaly=True):
    """Generate system metrics with optional anomaly injection"""
    print(f"Generating {num_records} metric records...")
    
    base_time = datetime.now() - timedelta(hours=2)
    
    for i in range(num_records):
        service = random.choice(SERVICES)
        timestamp = base_time + timedelta(seconds=i * 5)
        
        # Normal metrics
        error_count = random.randint(0, 5)
        latency = random.gauss(150, 50)  # Normal: ~150ms
        
        # Inject anomaly in payment-service at specific time
        if inject_anomaly and service == "payment-service" and i > num_records - 200:
            error_count = random.randint(50, 100)  # High error rate
            latency = random.gauss(2500, 500)  # High latency
        
        doc = {
            "@timestamp": timestamp.isoformat(),
            "service": {"name": service},
            "host": f"prod-{random.randint(1, 10)}",
            "error_count": error_count,
            "latency": max(0, latency),
            "requests_total": random.randint(800, 1200)
        }
        
        es.index(index="metrics-system", document=doc)
    
    print(" Metrics generated")


def generate_logs(num_records=500, inject_errors=True):
    """Generate application logs with errors"""
    print(f"Generating {num_records} log records...")
    
    base_time = datetime.now() - timedelta(hours=2)
    
    for i in range(num_records):
        service = random.choice(SERVICES)
        timestamp = base_time + timedelta(seconds=i * 10)
        
        # Mostly INFO logs
        log_level = random.choices(["INFO", "WARN", "ERROR", "CRITICAL"], 
                                   weights=[70, 20, 8, 2])[0]
        
        # Inject errors for payment-service
        if inject_errors and service == "payment-service" and i > num_records - 100:
            log_level = random.choices(["ERROR", "CRITICAL"], weights=[80, 20])[0]
        
        message = "Normal operation"
        error_type = None
        
        if log_level in ["ERROR", "CRITICAL"]:
            error_type = random.choice(ERROR_TYPES)
            message = f"{error_type}: Failed to process request"
        
        doc = {
            "@timestamp": timestamp.isoformat(),
            "service": {"name": service},
            "log": {"level": log_level},
            "message": message,
            "error": {"type": error_type} if error_type else {},
            "host": f"prod-{random.randint(1, 10)}"
        }
        
        es.index(index="logs-application", document=doc)
    
    print(" Logs generated")


def generate_deployments():
    """Generate deployment records"""
    print("Generating deployment records...")
    
    # Recent deployment for payment-service (45 min ago)
    deploy_time = datetime.now() - timedelta(minutes=45)
    
    doc = {
        "@timestamp": deploy_time.isoformat(),
        "service": {"name": "payment-service"},
        "version": "v2.4.1",
        "author": "john.doe@company.com",
        "description": "Updated database connection pool settings",
        "status": "success"
    }
    
    es.index(index="deployments-production", document=doc)
    
    print(" Deployments generated")


def create_lookup_services():
    """Create lookup table for service metadata"""
    print("Creating service lookup table...")
    
    for service, team in TEAMS.items():
        doc = {
            "service": {"name": service},
            "team": team,
            "criticality": "high" if service == "payment-service" else "medium",
            "on_call_channel": f"#oncall-{team}",
            "runbook_url": f"https://wiki.company.com/runbooks/{service}"
        }
        
        es.index(index="lookup-services", document=doc)
    
    print(" Service lookup created")


def generate_runbooks():
    """Generate sample runbooks with embeddings placeholder"""
    print("Generating runbook knowledge base...")
    
    runbooks = [
        {
            "title": "Database Connection Pool Tuning",
            "content": "When experiencing DatabaseConnectionTimeout errors, check connection pool size. Recommended pool size is 50-100 connections per instance.",
            "url": "https://wiki.company.com/db-pool-tuning",
            "tags": ["database", "connection", "performance"]
        },
        {
            "title": "Rollback Deployment Procedure",
            "content": "To rollback a deployment: 1. Identify the previous stable version 2. Run kubectl rollout undo deployment/SERVICE_NAME 3. Verify metrics return to normal",
            "url": "https://wiki.company.com/rollback-procedure",
            "tags": ["deployment", "rollback", "kubernetes"]
        },
        {
            "title": "High Latency Investigation",
            "content": "High P99 latency troubleshooting: Check database query performance, review recent deployments, verify external service health.",
            "url": "https://wiki.company.com/latency-investigation",
            "tags": ["latency", "performance", "troubleshooting"]
        }
    ]
    
    for rb in runbooks:
        es.index(index="runbooks-knowledge", document=rb)
    
    print(" Runbooks generated")


if __name__ == "__main__":
    print("=" * 60)
    print("DataPulse Synthetic Data Generator")
    print("=" * 60)
    
    # Create indices and generate data
    create_lookup_services()
    generate_runbooks()
    generate_deployments()
    generate_logs(num_records=500, inject_errors=True)
    generate_metrics(num_records=1000, inject_anomaly=True)
    
    print("=" * 60)
    print("[DONE] Data generation complete!")
    print("You can now run Sentinel to detect the injected anomaly.")
