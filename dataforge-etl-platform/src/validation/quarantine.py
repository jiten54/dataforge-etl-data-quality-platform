"""Quarantine Manager for DataForge ETL.

Segments incoming records into clean/valid records and quarantined records.
Ensures zero data loss while preventing invalid data from entering the warehouse.
"""

from typing import Tuple, List, Dict, Any, Optional
import json
import pandas as pd
from datetime import datetime


class QuarantineManager:
    """Isolates corrupt or invalid records and tracks root causes."""

    @staticmethod
    def partition_records(
        df: pd.DataFrame,
        rule_checks: List[Tuple[pd.Series, str, str]],  # (boolean_mask, rejection_code, reason)
        key_column: str,
        entity_name: str,
        run_id: str,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Evaluates rules sequentially; partitions into valid_df and quarantine_df.

        Args:
            df: The raw input DataFrame.
            rule_checks: List of (valid_mask, rejection_code, reason) tuples.
            key_column: Primary/Natural key column for identification.
            entity_name: Name of the business entity (e.g. 'orders').
            run_id: The pipeline execution run identifier.

        Returns:
            Tuple of (valid_df, quarantined_df)
        """
        if df.empty:
            empty_quarantine = pd.DataFrame(
                columns=["run_id", "entity_name", "natural_key", "rejection_code", "rejection_reason", "raw_payload"]
            )
            return df, empty_quarantine

        # Overall validity mask initialized to True
        valid_mask = pd.Series(True, index=df.index)
        quarantine_rows: List[Dict[str, Any]] = []

        # Find first failing rule for each failing row
        failed_indices = set()

        for mask, code, reason in rule_checks:
            # mask is True for valid, False for invalid
            failures = (~mask) & (~df.index.isin(failed_indices))
            failed_rows = df[failures]

            for idx, row in failed_rows.iterrows():
                failed_indices.add(idx)
                quarantine_rows.append({
                    "run_id": run_id,
                    "entity_name": entity_name,
                    "natural_key": str(row.get(key_column, f"ROW_{idx}")),
                    "rejection_code": code,
                    "rejection_reason": reason,
                    "raw_payload": json.dumps(row.to_dict(), default=str),
                    "quarantined_at": datetime.utcnow().isoformat(),
                })

        valid_df = df[~df.index.isin(failed_indices)].copy()
        quarantined_df = pd.DataFrame(quarantine_rows)

        return valid_df, quarantined_df
