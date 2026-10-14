"""Error Handling and Recovery Manager for DataForge.

Provides transactional rollback, dead-letter recording, and post-failure
clean state restoration.
"""

from typing import Optional
from sqlalchemy import text, Engine
from src.monitoring.logger import logger


class RecoveryManager:
    """Safely handles pipeline failure recovery without corrupting target state."""

    def __init__(self, engine: Engine):
        self.engine = engine

    def purge_staging_batch(self, batch_id: str) -> None:
        """Purges transient staging tables for an incomplete or aborted batch."""
        tables = ["stg_customers", "stg_products", "stg_orders", "stg_order_items"]
        with self.engine.begin() as conn:
            for tbl in tables:
                conn.execute(text(f"DELETE FROM {tbl} WHERE batch_id = :batch_id"), {"batch_id": batch_id})
        logger.info(f"Purged staging records for batch {batch_id}")

    def mark_run_failed(self, run_id: str, error_message: str, stack_trace: Optional[str] = None) -> None:
        """Updates pipeline_runs record status to FAILED with error diagnostic info."""
        sql = text("""
            UPDATE pipeline_runs 
            SET status = 'FAILED',
                error_message = :err,
                stack_trace = :stack,
                updated_at = CURRENT_TIMESTAMP
            WHERE run_id = :run_id
        """)
        with self.engine.begin() as conn:
            conn.execute(sql, {"run_id": run_id, "err": error_message, "stack": stack_trace})
        logger.error(f"Marked pipeline run {run_id} as FAILED: {error_message}")
