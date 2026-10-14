"""FastAPI Service for DataForge ETL Platform.

Provides RESTful endpoints for triggering pipeline executions, checking statuses,
inspecting data quality audit logs, and running reproducible benchmarks.
"""

import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

from src.config import config
from src.monitoring.logger import logger
from src.pipeline import DataForgePipeline

app = FastAPI(
    title="DataForge ETL Platform API",
    version="1.0.0",
    description="Automated ETL & Data Quality Service built for Athena Tech data engineering workloads.",
)

# Concurrency lock to prevent simultaneous overlapping runs
execution_lock = asyncio.Lock()
active_runs: Dict[str, Dict[str, Any]] = {}


class PipelineRunRequest(BaseModel):
    batch_name: Optional[str] = Field(default=None, description="Optional logical batch tag")
    dry_run: bool = Field(default=False, description="Simulate without database commit if True")


class PipelineRunResponse(BaseModel):
    run_id: str
    status: str
    message: str
    started_at: str


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health probe for Docker / Kubernetes checks."""
    return {"status": "healthy", "service": "dataforge-etl-api", "version": "1.0.0"}


@app.post(
    "/api/v1/pipelines/run",
    response_model=PipelineRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Pipelines"],
)
async def trigger_pipeline(request: PipelineRunRequest, background_tasks: BackgroundTasks):
    """Triggers an ETL pipeline run asynchronously.

    Enforces concurrency lock to prevent race conditions on staging tables.
    """
    if execution_lock.locked():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another pipeline run is currently in progress. Overlapping runs are rejected.",
        )

    pipeline = DataForgePipeline()
    run_id = pipeline.run_id

    async def run_worker():
        async with execution_lock:
            try:
                active_runs[run_id] = {"status": "RUNNING", "pipeline": pipeline}
                result = pipeline.run_all()
                active_runs[run_id] = {"status": "COMPLETED", "result": result}
            except Exception as e:
                active_runs[run_id] = {"status": "FAILED", "error": str(e)}

    background_tasks.add_task(run_worker)

    return PipelineRunResponse(
        run_id=run_id,
        status="ACCEPTED",
        message="Pipeline execution scheduled in background.",
        started_at=datetime.utcnow().isoformat(),
    )


@app.get("/api/v1/pipelines/status/{run_id}", tags=["Pipelines"])
def get_run_status(run_id: str):
    """Retrieves current execution status and metrics for a specific pipeline run."""
    if run_id in active_runs:
        return active_runs[run_id]

    # Fallback to database lookup
    engine = create_engine(config.get_database_url())
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM pipeline_runs WHERE run_id = :run_id"),
            {"run_id": run_id},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Run ID {run_id} not found.")

    return dict(row)


@app.get("/api/v1/pipelines/history", tags=["Pipelines"])
def list_pipeline_history(limit: int = 20):
    """Returns the most recent pipeline execution runs from audit metadata."""
    engine = create_engine(config.get_database_url())
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT :limit"),
            {"limit": limit},
        ).mappings().all()

    return [dict(r) for r in rows]


@app.get("/api/v1/data-quality/summary", tags=["Data Quality"])
def get_data_quality_summary():
    """Aggregates quarantined records by entity and rejection code."""
    engine = create_engine(config.get_database_url())
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT entity_name, rejection_code, COUNT(*) as count 
                FROM quarantined_records 
                GROUP BY entity_name, rejection_code 
                ORDER BY count DESC
            """)
        ).mappings().all()

    return {"summary": [dict(r) for r in rows]}
