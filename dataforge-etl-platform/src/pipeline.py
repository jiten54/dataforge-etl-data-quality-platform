"""DataForge Main Pipeline Orchestrator.

Integrates Extraction, Validation, Quarantine, Transformation,
Idempotent Loading, and Reconciliation Reporting into a unified, reproducible runner.
"""

import uuid
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import pandas as pd
from src.config import config
from src.monitoring.logger import logger
from src.monitoring.metrics import PipelineMetricsTracker
from src.monitoring.reconciliation import generate_reconciliation_report
from src.extract.csv_extractor import CSVExtractor
from src.validation.schema_validator import SchemaValidator
from src.validation.quality_rules import QualityRules
from src.validation.quarantine import QuarantineManager
from src.transform.cleaner import DataCleaner
from src.transform.normalizer import DataNormalizer
from src.transform.business_rules import BusinessRulesTransformer
from src.load.mysql_loader import MySQLLoader
from src.load.recovery import RecoveryManager


class DataForgePipeline:
    """Production-grade ETL pipeline implementing Athena Tech specifications."""

    def __init__(self, run_id: Optional[str] = None, batch_id: Optional[str] = None, is_test: bool = False):
        self.run_id = run_id or f"run_{uuid.uuid4().hex[:12]}"
        self.batch_id = batch_id or f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        self.is_test = is_test
        self.db_url = config.get_database_url(is_test=self.is_test)
        self.loader = MySQLLoader(self.db_url)
        self.recovery = RecoveryManager(self.loader.engine)
        self.metrics = PipelineMetricsTracker(self.run_id)

    def run_all(self, data_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Executes full retail data pipeline: Customers, Products, Orders, Order Items."""
        source_dir = data_dir or config.DATA_RAW_DIR
        logger.info(f"Starting pipeline {self.run_id} (batch {self.batch_id}) from {source_dir}")

        # Initial audit log record
        self.loader.record_pipeline_run({
            "run_id": self.run_id,
            "pipeline_name": "retail_ecomm_elt",
            "batch_id": self.batch_id,
            "status": "RUNNING",
            "source_type": "CSV",
            "rows_extracted": 0,
            "rows_valid": 0,
            "rows_quarantined": 0,
            "rows_loaded": 0,
            "rows_updated": 0,
            "execution_duration_sec": 0.0,
            "memory_peak_mb": self.metrics.get_current_memory_mb(),
            "error_message": None,
        })

        try:
            # 1. Extraction Stage
            self.metrics.start_stage("extract")
            cust_extractor = CSVExtractor(source_dir / "customers_raw.csv")
            prod_extractor = CSVExtractor(source_dir / "products_raw.csv")
            ord_extractor = CSVExtractor(source_dir / "orders_raw.csv")
            items_extractor = CSVExtractor(source_dir / "order_items_raw.csv")

            df_cust_raw = cust_extractor.extract_full()
            df_prod_raw = prod_extractor.extract_full()
            df_ord_raw = ord_extractor.extract_full()
            df_items_raw = items_extractor.extract_full()

            total_extracted = len(df_cust_raw) + len(df_prod_raw) + len(df_ord_raw) + len(df_items_raw)
            self.metrics.end_stage("extract", rows_out=total_extracted)

            # 2. Validation & Quarantine Stage
            self.metrics.start_stage("validate")

            # Validate Customers: Email regex, non-null customer_id
            cust_checks = [
                (df_cust_raw["customer_id"].notna(), "NULL_PK", "Customer ID is required and cannot be null"),
                (QualityRules.validate_email_syntax(df_cust_raw["email"]), "INVALID_EMAIL", "Customer email does not conform to RFC 5322 regex"),
            ]
            valid_cust, quar_cust = QuarantineManager.partition_records(
                df_cust_raw, cust_checks, "customer_id", "customers", self.run_id
            )

            # Validate Products: Unit price > 0, non-null sku
            prod_checks = [
                (df_prod_raw["product_id"].notna(), "NULL_PK", "Product ID cannot be null"),
                (df_prod_raw["sku"].notna() & (df_prod_raw["sku"] != ""), "MISSING_SKU", "Product SKU is required"),
                (QualityRules.validate_positive_number(df_prod_raw["unit_price"]), "NEGATIVE_PRICE", "Unit price must be strictly greater than zero"),
            ]
            valid_prod, quar_prod = QuarantineManager.partition_records(
                df_prod_raw, prod_checks, "product_id", "products", self.run_id
            )

            # Validate Orders: FK to valid customers, Order Status enum, Order date not future
            valid_cust_ids = set(valid_cust["customer_id"].dropna().astype(int).unique())
            ord_checks = [
                (df_ord_raw["order_id"].notna(), "NULL_PK", "Order ID cannot be null"),
                (QualityRules.validate_foreign_key(df_ord_raw["customer_id"], valid_cust_ids), "INVALID_FK_CUSTOMER", "Referenced customer_id does not exist in valid customer dimension"),
                (QualityRules.validate_order_status(df_ord_raw["order_status"]), "INVALID_STATUS", "Order status is not in allowed domain enum"),
                (QualityRules.validate_order_date_range(df_ord_raw["order_date"]), "INVALID_DATE", "Order date is out of allowable timeline bounds or malformed"),
            ]
            valid_ord, quar_ord = QuarantineManager.partition_records(
                df_ord_raw, ord_checks, "order_id", "orders", self.run_id
            )

            # Validate Order Items: FK to valid orders & valid products, quantity > 0
            valid_order_ids = set(valid_ord["order_id"].dropna().astype(int).unique())
            valid_prod_ids = set(valid_prod["product_id"].dropna().astype(int).unique())
            items_checks = [
                (df_items_raw["order_item_id"].notna(), "NULL_PK", "Order item ID cannot be null"),
                (QualityRules.validate_foreign_key(df_items_raw["order_id"], valid_order_ids), "INVALID_FK_ORDER", "Order item references non-existent or quarantined order_id"),
                (QualityRules.validate_foreign_key(df_items_raw["product_id"], valid_prod_ids), "INVALID_FK_PRODUCT", "Order item references non-existent or quarantined product_id"),
                (QualityRules.validate_positive_number(df_items_raw["quantity"]), "INVALID_QUANTITY", "Item quantity must be a positive integer greater than zero"),
            ]
            valid_items, quar_items = QuarantineManager.partition_records(
                df_items_raw, items_checks, "order_item_id", "order_items", self.run_id
            )

            all_quarantine = pd.concat([quar_cust, quar_prod, quar_ord, quar_items], ignore_index=True)
            total_quarantined = len(all_quarantine)
            total_valid = len(valid_cust) + len(valid_prod) + len(valid_ord) + len(valid_items)
            self.metrics.end_stage("validate", rows_out=total_valid)

            # 3. Clean & Deduplicate Stage
            self.metrics.start_stage("clean")
            valid_cust = DataCleaner.strip_string_columns(valid_cust)
            valid_cust = DataCleaner.deduplicate(valid_cust, subset=["customer_id"])

            valid_prod = DataCleaner.strip_string_columns(valid_prod)
            valid_prod = DataCleaner.deduplicate(valid_prod, subset=["product_id"])

            valid_ord = DataCleaner.strip_string_columns(valid_ord)
            valid_ord = DataCleaner.deduplicate(valid_ord, subset=["order_id"])

            valid_items = DataCleaner.deduplicate(valid_items, subset=["order_item_id"])
            self.metrics.end_stage("clean", rows_out=len(valid_cust) + len(valid_prod) + len(valid_ord) + len(valid_items))

            # 4. Transform & Enrich Stage
            self.metrics.start_stage("transform")
            # Normalization
            valid_cust = DataNormalizer.normalize_dates(valid_cust, ["registration_date"])
            valid_prod = DataNormalizer.normalize_currency(valid_prod, ["unit_price", "cost_price"])
            valid_ord = DataNormalizer.normalize_dates(valid_ord, ["order_date"])
            valid_ord = DataNormalizer.normalize_currency(valid_ord, ["shipping_amount", "tax_amount", "discount_amount", "total_amount"])

            # Business enrichment
            valid_items = BusinessRulesTransformer.calculate_order_item_totals(valid_items, valid_prod)
            valid_cust = BusinessRulesTransformer.assign_customer_tiers(valid_cust, valid_ord)
            self.metrics.end_stage("transform", rows_out=len(valid_cust) + len(valid_prod) + len(valid_ord) + len(valid_items))

            # 5. Database Loading Stage (Idempotent)
            self.metrics.start_stage("load")
            if not all_quarantine.empty:
                self.loader.load_quarantined_records(all_quarantine)

            loaded_cust = self.loader.load_customers(valid_cust, self.batch_id)
            loaded_prod = self.loader.load_products(valid_prod, self.batch_id)
            loaded_ord = self.loader.load_orders(valid_ord, self.batch_id)
            loaded_items = self.loader.load_order_items(valid_items, self.batch_id)

            total_loaded = loaded_cust + loaded_prod + loaded_ord + loaded_items
            self.metrics.end_stage("load", rows_out=total_loaded)

            # 6. Finalize Summary & Reconciliation
            final_metrics = self.metrics.finish()
            reconciliation = {
                "customers": generate_reconciliation_report("customers", len(df_cust_raw), len(valid_cust), len(quar_cust), loaded_cust).to_dict(),
                "products": generate_reconciliation_report("products", len(df_prod_raw), len(valid_prod), len(quar_prod), loaded_prod).to_dict(),
                "orders": generate_reconciliation_report("orders", len(df_ord_raw), len(valid_ord), len(quar_ord), loaded_ord).to_dict(),
                "order_items": generate_reconciliation_report("order_items", len(df_items_raw), len(valid_items), len(quar_items), loaded_items).to_dict(),
            }

            self.loader.record_pipeline_run({
                "run_id": self.run_id,
                "pipeline_name": "retail_ecomm_elt",
                "batch_id": self.batch_id,
                "status": "COMPLETED",
                "source_type": "CSV",
                "rows_extracted": total_extracted,
                "rows_valid": total_valid,
                "rows_quarantined": total_quarantined,
                "rows_loaded": total_loaded,
                "rows_updated": 0,
                "execution_duration_sec": final_metrics["total_duration_sec"],
                "memory_peak_mb": final_metrics["peak_memory_mb"],
                "error_message": None,
            })

            logger.info(f"Pipeline {self.run_id} completed successfully in {final_metrics['total_duration_sec']}s")
            return {
                "run_id": self.run_id,
                "batch_id": self.batch_id,
                "status": "COMPLETED",
                "extracted": total_extracted,
                "valid": total_valid,
                "quarantined": total_quarantined,
                "loaded": total_loaded,
                "duration_sec": final_metrics["total_duration_sec"],
                "peak_memory_mb": final_metrics["peak_memory_mb"],
                "reconciliation": reconciliation,
                "quarantine_summary": all_quarantine["rejection_code"].value_counts().to_dict() if not all_quarantine.empty else {},
            }

        except Exception as e:
            err_msg = str(e)
            stack = traceback.format_exc()
            logger.error(f"Pipeline execution failed: {err_msg}\n{stack}")
            self.recovery.mark_run_failed(self.run_id, err_msg, stack)
            self.recovery.purge_staging_batch(self.batch_id)
            raise


if __name__ == "__main__":
    pipeline = DataForgePipeline()
    result = pipeline.run_all()
    print("Execution Result:", result)
