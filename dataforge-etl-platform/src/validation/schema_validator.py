"""Schema Validation Module for DataForge.

Validates column presence, expected types, and required non-null constraints
prior to downstream transformations.
"""

from typing import List, Dict, Any, Tuple
import pandas as pd


class SchemaValidator:
    """Validates dataframe adherence to defined schema specifications."""

    def __init__(self, required_columns: List[str], type_mapping: Dict[str, str]):
        self.required_columns = required_columns
        self.type_mapping = type_mapping

    def validate_columns(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Checks if all required columns exist in the DataFrame."""
        missing = [col for col in self.required_columns if col not in df.columns]
        if missing:
            return False, [f"Missing required column(s): {', '.join(missing)}"]
        return True, []

    def validate_non_null(self, df: pd.DataFrame, non_null_cols: List[str]) -> pd.Series:
        """Returns boolean mask where True indicates all specified cols are non-null."""
        mask = pd.Series(True, index=df.index)
        for col in non_null_cols:
            if col in df.columns:
                mask = mask & df[col].notna() & (df[col].astype(str).str.strip() != "")
        return mask
