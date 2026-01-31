from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from loguru import logger
from src.runbook_search import resolve_incident

app = FastAPI(title="Resolver Agent", version="1.0.0")

class ResolveRequest(BaseModel):
    incident_id: str
    rcca_context: dict # Pass the full RCA here or fetch it

@app.post("/run")
async def run_resolution(req: ResolveRequest, background_tasks: BackgroundTasks):
    logger.info(f"Resolution requested for {req.incident_id}")
    background_tasks.add_task(resolve_incident, req.incident_id, req.rcca_context)
    return {"status": "resolution_started"}
