from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from loguru import logger
from src.correlator import run_rca_investigation

app = FastAPI(title="Analyst Agent", version="1.0.0")

class AnalyzeRequest(BaseModel):
    incident_id: str
    service: str
    detected_at: str

@app.post("/run")
async def run_analysis(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    logger.info(f"Received analysis request for incident {req.incident_id}")
    background_tasks.add_task(run_rca_investigation, req.incident_id, req.service, req.detected_at)
    return {"status": "analysis_started", "incident_id": req.incident_id}
