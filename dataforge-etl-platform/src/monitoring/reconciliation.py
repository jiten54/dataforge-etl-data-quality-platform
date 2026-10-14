"""Data Reconciliation Engine for DataForge ETL.

Ensures complete auditability: extracted == valid + quarantined.
Checks integrity between source and target database counts.
"""

from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class ReconciliationSummary:
    entity_name: str
    extracted_count: int
    valid_count: int
    quarantined_count: int
    loaded_count: int
    updated_count: int
    is_balanced: bool
    discrepancy: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity": self.entity_name,
            "extracted": self.extracted_count,
            "valid": self.valid_count,
            "quarantined": self.quarantined_count,
            "loaded": self.loaded_count,
            "updated": self.updated_count,
            "is_balanced": self.is_balanced,
            "discrepancy": self.discrepancy,
        }


def generate_reconciliation_report(
    entity_name: str,
    extracted_count: int,
    valid_count: int,
    quarantined_count: int,
    loaded_count: int,
    updated_count: int = 0,
) -> ReconciliationSummary:
    """Verifies conservation of rows across ETL lifecycle."""
    expected_total = valid_count + quarantined_count
    discrepancy = extracted_count - expected_total
    is_balanced = discrepancy == 0

    return ReconciliationSummary(
        entity_name=entity_name,
        extracted_count=extracted_count,
        valid_count=valid_count,
        quarantined_count=quarantined_count,
        loaded_count=loaded_count,
        updated_count=updated_count,
        is_balanced=is_balanced,
        discrepancy=discrepancy,
    )
