import asyncio
from fastapi import FastAPI, BackgroundTasks
from loguru import logger
from src.detector import run_anomaly_detection_cycle
import os

app = FastAPI(title="Sentinel Agent", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("Sentinel Agent starting up...")
    # Start the continuous detection loop in background
    asyncio.create_task(continuous_monitoring())

@app.get("/healthz")
async def health():
    return {"status": "ok"}

@app.post("/run")
async def trigger_run(background_tasks: BackgroundTasks):
    """Manually trigger a detection run"""
    background_tasks.add_task(run_anomaly_detection_cycle)
    return {"status": "detection_triggered"}

async def continuous_monitoring():
    """Background loop to run detection every minute"""
    while True:
        try:
            logger.info("Running scheduled anomaly detection...")
            await run_anomaly_detection_cycle()
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")
        
        # Sleep for detection interval (e.g., 60s)
        await asyncio.sleep(60)
