"""Idempotent Upsert Module for MySQL 8.

Generates and executes parameterized MySQL 'INSERT ... ON DUPLICATE KEY UPDATE'
statements to guarantee replayability without duplication or corruption.
"""

from typing import List, Dict, Any
import pandas as pd
from sqlalchemy import text, Engine
from src.monitoring.logger import logger


class IdempotentUpsert:
    """Executes high-performance parameterized upserts into MySQL."""

    @staticmethod
    def build_upsert_query(
        table_name: str,
        columns: List[str],
        primary_keys: List[str],
    ) -> str:
        """Constructs an INSERT ... ON DUPLICATE KEY UPDATE SQL query."""
        cols_joined = ", ".join(columns)
        params_joined = ", ".join([f":{col}" for col in columns])

        update_cols = [col for col in columns if col not in primary_keys]
        if not update_cols:
            update_clause = f"{primary_keys[0]} = {primary_keys[0]}"
        else:
            update_clause = ", ".join([f"{col} = VALUES({col})" for col in update_cols])

        return (
            f"INSERT INTO {table_name} ({cols_joined}) "
            f"VALUES ({params_joined}) "
            f"ON DUPLICATE KEY UPDATE {update_clause};"
        )

    @classmethod
    def execute_upsert(
        cls,
        engine: Engine,
        table_name: str,
        df: pd.DataFrame,
        primary_keys: List[str],
        batch_size: int = 1000,
    ) -> int:
        """Executes batched idempotent upsert on DataFrame records."""
        if df.empty:
            return 0

        columns = list(df.columns)
        sql = cls.build_upsert_query(table_name, columns, primary_keys)
        records = df.to_dict(orient="records")

        # Convert numpy/pandas nulls to Python None
        for record in records:
            for k, v in record.items():
                if pd.isna(v):
                    record[k] = None

        total_affected = 0
        with engine.begin() as conn:
            for i in range(0, len(records), batch_size):
                chunk = records[i : i + batch_size]
                result = conn.execute(text(sql), chunk)
                total_affected += result.rowcount or len(chunk)

        logger.info(f"Upserted {len(records)} records into {table_name} (affected: {total_affected})")
        return len(records)
