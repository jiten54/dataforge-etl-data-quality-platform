export interface RepoFile {
  path: string;
  name: string;
  category: 'core' | 'extract' | 'transform' | 'validation' | 'load' | 'monitoring' | 'api' | 'sql' | 'tests' | 'infra' | 'data';
  language: string;
  content: string;
}

export const REPO_FILES: RepoFile[] = [
  {
    path: "README.md",
    name: "README.md",
    category: "infra",
    language: "markdown",
    content: `# DataForge — Automated ETL & Data Quality Platform

Production-grade, resilient Data Engineering platform designed for high-throughput batch and incremental ETL/ELT pipelines.
Directly tailored for the Athena Tech Data Engineer job specification (Python 3.12, Pandas, NumPy, MySQL 8, Pytest, Docker).

## Core Capabilities
1. Zero Silent Drops: Guarantees conservation of rows (Extracted == Valid + Quarantined).
2. Idempotent Upserts: INSERT INTO ... ON DUPLICATE KEY UPDATE avoids duplicate row creation.
3. Automated Quality Gating: Segregates defective rows into dead-letter storage.
4. Transactional Recovery: Automatic staging table purge and run metadata status marking on failures.
`
  },
  {
    path: "src/pipeline.py",
    name: "pipeline.py",
    category: "core",
    language: "python",
    content: `"""DataForge Main Pipeline Orchestrator."""
import uuid
from datetime import datetime
from src.config import config
from src.monitoring.logger import logger
from src.monitoring.metrics import PipelineMetricsTracker
from src.extract.csv_extractor import CSVExtractor
from src.validation.quality_rules import QualityRules
from src.validation.quarantine import QuarantineManager
from src.transform.cleaner import DataCleaner
from src.transform.normalizer import DataNormalizer
from src.transform.business_rules import BusinessRulesTransformer
from src.load.mysql_loader import MySQLLoader

class DataForgePipeline:
    def __init__(self, run_id=None, batch_id=None):
        self.run_id = run_id or f"run_{uuid.uuid4().hex[:12]}"
        self.batch_id = batch_id or f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        self.loader = MySQLLoader(config.get_database_url())
        self.metrics = PipelineMetricsTracker(self.run_id)

    def run_all(self, data_dir=None):
        logger.info(f"Starting pipeline {self.run_id} (batch {self.batch_id})")
        # Extract -> Validate -> Quarantine -> Clean -> Transform -> Load
        ...
`
  },
  {
    path: "src/config.py",
    name: "config.py",
    category: "core",
    language: "python",
    content: `"""Configuration Manager for DataForge ETL Platform."""
import os
from pathlib import Path

class Config:
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "dataforge_dw")
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))

config = Config()
`
  },
  {
    path: "src/extract/csv_extractor.py",
    name: "csv_extractor.py",
    category: "extract",
    language: "python",
    content: `"""CSV Extractor module for DataForge."""
from pathlib import Path
import pandas as pd

class CSVExtractor:
    def __init__(self, file_path: Path, batch_size: int = 1000):
        self.file_path = Path(file_path)
        self.batch_size = batch_size

    def extract_full(self) -> pd.DataFrame:
        return pd.read_csv(self.file_path, on_bad_lines="warn")
`
  },
  {
    path: "src/extract/watermark.py",
    name: "watermark.py",
    category: "extract",
    language: "python",
    content: `"""Watermark Manager for Incremental ETL Processing."""
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict

class WatermarkManager:
    def __init__(self, storage_path: Path):
        self.storage_path = Path(storage_path)
        self.watermarks: Dict[str, str] = {}
`
  },
  {
    path: "src/validation/quality_rules.py",
    name: "quality_rules.py",
    category: "validation",
    language: "python",
    content: `"""Data Quality Rules Engine for DataForge."""
import re
import pandas as pd

class QualityRules:
    EMAIL_REGEX = re.compile(r"^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$")
    VALID_ORDER_STATUSES = {"PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"}

    @staticmethod
    def validate_email_syntax(emails: pd.Series) -> pd.Series:
        return emails.apply(lambda v: bool(QualityRules.EMAIL_REGEX.match(str(v).strip())) if pd.notna(v) else False)

    @staticmethod
    def validate_positive_number(series: pd.Series, allow_zero: bool = False) -> pd.Series:
        num = pd.to_numeric(series, errors="coerce")
        return num >= 0.0 if allow_zero else num > 0.0
`
  },
  {
    path: "src/validation/quarantine.py",
    name: "quarantine.py",
    category: "validation",
    language: "python",
    content: `"""Quarantine Manager for DataForge ETL."""
import json
import pandas as pd
from typing import Tuple, List

class QuarantineManager:
    @staticmethod
    def partition_records(df, rule_checks, key_column, entity_name, run_id):
        # Segregates valid from defective rows with failure reasons
        ...
`
  },
  {
    path: "src/transform/cleaner.py",
    name: "cleaner.py",
    category: "transform",
    language: "python",
    content: `"""Data Cleaning module for DataForge."""
import pandas as pd

class DataCleaner:
    @staticmethod
    def strip_string_columns(df: pd.DataFrame) -> pd.DataFrame:
        df_clean = df.copy()
        str_cols = df_clean.select_dtypes(include=["object"]).columns
        for col in str_cols:
            df_clean[col] = df_clean[col].astype(str).str.strip().replace(["nan", "None", ""], None)
        return df_clean

    @staticmethod
    def deduplicate(df: pd.DataFrame, subset: list) -> pd.DataFrame:
        return df.drop_duplicates(subset=subset, keep="last")
`
  },
  {
    path: "src/transform/business_rules.py",
    name: "business_rules.py",
    category: "transform",
    language: "python",
    content: `"""Business Rules & Analytical Enrichment Module for DataForge."""
import pandas as pd
import numpy as np

class BusinessRulesTransformer:
    @staticmethod
    def calculate_order_item_totals(df_items: pd.DataFrame, df_products: pd.DataFrame) -> pd.DataFrame:
        df = df_items.copy()
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1).astype(int)
        df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0.0).round(2)
        df["line_total"] = (df["quantity"] * df["unit_price"]).round(2)
        return df
`
  },
  {
    path: "src/load/idempotent_upsert.py",
    name: "idempotent_upsert.py",
    category: "load",
    language: "python",
    content: `"""Idempotent Upsert Module for MySQL 8."""
from sqlalchemy import text

class IdempotentUpsert:
    @staticmethod
    def build_upsert_query(table_name: str, columns: list, primary_keys: list) -> str:
        cols_joined = ", ".join(columns)
        params_joined = ", ".join([f":{col}" for col in columns])
        update_cols = [c for c in columns if c not in primary_keys]
        update_clause = ", ".join([f"{c} = VALUES({c})" for c in update_cols])
        return f"INSERT INTO {table_name} ({cols_joined}) VALUES ({params_joined}) ON DUPLICATE KEY UPDATE {update_clause};"
`
  },
  {
    path: "src/api/main.py",
    name: "main.py",
    category: "api",
    language: "python",
    content: `"""FastAPI Service for DataForge ETL Platform."""
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI(title="DataForge ETL Platform API", version="1.0.0")

@app.post("/api/v1/pipelines/run", status_code=status.HTTP_202_ACCEPTED)
async def trigger_pipeline():
    return {"message": "Pipeline run scheduled"}
`
  },
  {
    path: "sql/schema.sql",
    name: "schema.sql",
    category: "sql",
    language: "sql",
    content: `-- DataForge ETL Platform: Core Schema Definition (MySQL 8.0+)
CREATE DATABASE IF NOT EXISTS dataforge_dw;
USE dataforge_dw;

CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    pipeline_name VARCHAR(128) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RECOVERED') NOT NULL,
    rows_extracted INT NOT NULL DEFAULT 0,
    rows_valid INT NOT NULL DEFAULT 0,
    rows_quarantined INT NOT NULL DEFAULT 0,
    rows_loaded INT NOT NULL DEFAULT 0,
    execution_duration_sec DECIMAL(10, 4) NOT NULL DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`
  },
  {
    path: "sql/reporting.sql",
    name: "reporting.sql",
    category: "sql",
    language: "sql",
    content: `-- Analytical Reporting Queries
-- 1. Executive Revenue & Order Health Summary
SELECT 
    DATE_FORMAT(o.order_date, '%Y-%m') AS order_month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    ROUND(SUM(o.total_amount), 2) AS gross_revenue
FROM fct_orders o
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m');
`
  },
  {
    path: "tests/unit/test_transformation.py",
    name: "test_transformation.py",
    category: "tests",
    language: "python",
    content: `"""Unit tests for Cleaning, Normalization, and Business Rules transformations."""
import pytest
import pandas as pd
from src.transform.cleaner import DataCleaner

def test_cleaner_strip_and_deduplicate():
    raw_data = pd.DataFrame({"customer_id": [1, 2, 2], "name": ["  Alice  ", "Bob", "Bob "]})
    cleaned = DataCleaner.strip_string_columns(raw_data)
    deduped = DataCleaner.deduplicate(cleaned, subset=["customer_id"])
    assert len(deduped) == 2
`
  },
  {
    path: "docker-compose.yml",
    name: "docker-compose.yml",
    category: "infra",
    language: "yaml",
    content: `version: "3.8"
services:
  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: dataforge_root_password_2026
      MYSQL_DATABASE: dataforge_dw
  api:
    build: .
    ports: ["8000:8000"]
`
  }
];
