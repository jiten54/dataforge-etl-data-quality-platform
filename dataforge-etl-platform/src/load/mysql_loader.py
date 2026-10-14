"""MySQL Loader for DataForge ETL.

Manages connections, staging loads, dimension & fact updates, and quarantine persistence.
"""

from typing import Dict, Any, List
import pandas as pd
from sqlalchemy import create_engine, text, Engine
from src.monitoring.logger import logger
from src.load.idempotent_upsert import IdempotentUpsert


class MySQLLoader:
    """Orchestrates loading into Staging, Dimension, and Fact tables."""

    def __init__(self, connection_url: str):
        self.engine: Engine = create_engine(
            connection_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )

    def load_quarantined_records(self, df_quarantine: pd.DataFrame) -> int:
        """Appends quarantined records to the dead-letter table."""
        if df_quarantine.empty:
            return 0

        logger.info(f"Persisting {len(df_quarantine)} quarantined records...")
        records = df_quarantine.to_dict(orient="records")
        sql = text("""
            INSERT INTO quarantined_records 
            (run_id, entity_name, natural_key, rejection_code, rejection_reason, raw_payload)
            VALUES (:run_id, :entity_name, :natural_key, :rejection_code, :rejection_reason, :raw_payload)
        """)

        with self.engine.begin() as conn:
            conn.execute(sql, records)

        return len(records)

    def load_customers(self, df_customers: pd.DataFrame, batch_id: str) -> int:
        """Loads customer records idempotently into dim_customers."""
        df = df_customers.copy()
        df["last_batch_id"] = batch_id
        return IdempotentUpsert.execute_upsert(
            engine=self.engine,
            table_name="dim_customers",
            df=df,
            primary_keys=["customer_id"],
        )

    def load_products(self, df_products: pd.DataFrame, batch_id: str) -> int:
        """Loads product catalog idempotently into dim_products."""
        df = df_products.copy()
        df["last_batch_id"] = batch_id
        return IdempotentUpsert.execute_upsert(
            engine=self.engine,
            table_name="dim_products",
            df=df,
            primary_keys=["product_id"],
        )

    def load_orders(self, df_orders: pd.DataFrame, batch_id: str) -> int:
        """Loads orders idempotently into fct_orders."""
        df = df_orders.copy()
        df["last_batch_id"] = batch_id
        return IdempotentUpsert.execute_upsert(
            engine=self.engine,
            table_name="fct_orders",
            df=df,
            primary_keys=["order_id"],
        )

    def load_order_items(self, df_order_items: pd.DataFrame, batch_id: str) -> int:
        """Loads order line items idempotently into fct_order_items."""
        df = df_order_items.copy()
        df["last_batch_id"] = batch_id
        return IdempotentUpsert.execute_upsert(
            engine=self.engine,
            table_name="fct_order_items",
            df=df,
            primary_keys=["order_item_id"],
        )

    def record_pipeline_run(self, run_metadata: Dict[str, Any]) -> None:
        """Inserts or updates the execution status in pipeline_runs table."""
        sql = text("""
            INSERT INTO pipeline_runs 
            (run_id, pipeline_name, batch_id, status, source_type, rows_extracted, 
             rows_valid, rows_quarantined, rows_loaded, rows_updated, 
             execution_duration_sec, memory_peak_mb, error_message)
            VALUES 
            (:run_id, :pipeline_name, :batch_id, :status, :source_type, :rows_extracted,
             :rows_valid, :rows_quarantined, :rows_loaded, :rows_updated,
             :execution_duration_sec, :memory_peak_mb, :error_message)
            ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             rows_extracted = VALUES(rows_extracted),
             rows_valid = VALUES(rows_valid),
             rows_quarantined = VALUES(rows_quarantined),
             rows_loaded = VALUES(rows_loaded),
             rows_updated = VALUES(rows_updated),
             execution_duration_sec = VALUES(execution_duration_sec),
             memory_peak_mb = VALUES(memory_peak_mb),
             error_message = VALUES(error_message);
        """)
        with self.engine.begin() as conn:
            conn.execute(sql, run_metadata)
