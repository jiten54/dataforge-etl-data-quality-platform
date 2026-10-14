"""Integration tests for end-to-end DataForge pipeline workflow."""

import pytest
import pandas as pd
from pathlib import Path
from src.config import config
from src.validation.quality_rules import QualityRules
from src.validation.quarantine import QuarantineManager
from src.transform.cleaner import DataCleaner
from src.transform.normalizer import DataNormalizer
from src.transform.business_rules import BusinessRulesTransformer
from src.monitoring.reconciliation import generate_reconciliation_report


def test_end_to_end_pipeline_simulation():
    # 1. Load sample dataset from disk
    sample_dir = config.DATA_RAW_DIR
    cust_df = pd.read_csv(sample_dir / "customers_raw.csv")
    prod_df = pd.read_csv(sample_dir / "products_raw.csv")
    ord_df = pd.read_csv(sample_dir / "orders_raw.csv")
    items_df = pd.read_csv(sample_dir / "order_items_raw.csv")

    assert len(cust_df) > 0
    assert len(prod_df) > 0
    assert len(ord_df) > 0
    assert len(items_df) > 0

    # 2. Quarantine validation on customers
    cust_checks = [
        (cust_df["customer_id"].notna(), "NULL_PK", "Customer ID is required"),
        (QualityRules.validate_email_syntax(cust_df["email"]), "INVALID_EMAIL", "Email invalid"),
    ]
    valid_cust, quar_cust = QuarantineManager.partition_records(
        cust_df, cust_checks, "customer_id", "customers", "test_run_001"
    )

    # 3. Verify that defective records are identified
    assert len(quar_cust) >= 2  # The ghost user and bad email user
    assert "INVALID_EMAIL" in quar_cust["rejection_code"].values

    # 4. Clean & Deduplicate
    valid_cust = DataCleaner.strip_string_columns(valid_cust)
    valid_cust = DataCleaner.deduplicate(valid_cust, subset=["customer_id"])

    # 5. Transform
    valid_cust = DataNormalizer.normalize_dates(valid_cust, ["registration_date"])

    # 6. Verify Reconciliation
    rec = generate_reconciliation_report(
        "customers",
        extracted_count=len(cust_df),
        valid_count=len(valid_cust),
        quarantined_count=len(quar_cust),
        loaded_count=len(valid_cust),
    )
    # Conservation check: valid + quarantined should account for rows (minus deduplicated)
    assert rec.valid_count + rec.quarantined_count <= rec.extracted_count
