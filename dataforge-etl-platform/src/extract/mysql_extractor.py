"""MySQL Extractor for Incremental and Full Table Data Ingestion."""

from datetime import datetime
from typing import Optional, Dict, Any, List
import pandas as pd
from sqlalchemy import create_engine, text
from src.monitoring.logger import logger
from src.extract.watermark import WatermarkManager


class MySQLExtractor:
    """Extracts records from operational MySQL database using SQLAlchemy & PyMySQL."""

    def __init__(self, connection_url: str, watermark_manager: Optional[WatermarkManager] = None):
        self.engine = create_engine(connection_url, pool_pre_ping=True)
        self.watermark_mgr = watermark_manager

    def extract_table(
        self,
        table_name: str,
        incremental_column: Optional[str] = None,
        watermark_entity: Optional[str] = None,
    ) -> pd.DataFrame:
        """Extracts records from table, supporting watermark-based incremental delta query."""
        watermark_val: Optional[datetime] = None
        if incremental_column and self.watermark_mgr and watermark_entity:
            watermark_val = self.watermark_mgr.get_watermark(watermark_entity)

        with self.engine.connect() as conn:
            if watermark_val and incremental_column:
                logger.info(f"Incremental query on {table_name} where {incremental_column} > {watermark_val}")
                query = text(f"SELECT * FROM {table_name} WHERE {incremental_column} > :watermark ORDER BY {incremental_column} ASC")
                df = pd.read_sql(query, conn, params={"watermark": watermark_val})
            else:
                logger.info(f"Full snapshot extraction from {table_name}")
                query = text(f"SELECT * FROM {table_name}")
                df = pd.read_sql(query, conn)

        logger.info(f"Extracted {len(df)} records from {table_name}")
        return df
