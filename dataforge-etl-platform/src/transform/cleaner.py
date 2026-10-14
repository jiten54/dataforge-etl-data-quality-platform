"""Data Cleaning module for DataForge.

Performs deduplication, whitespace stripping, and null value handling
using vectorized Pandas operations.
"""

from typing import List, Optional
import pandas as pd
from src.monitoring.logger import logger


class DataCleaner:
    """Vectorized cleaning operations for raw datasets."""

    @staticmethod
    def strip_string_columns(df: pd.DataFrame) -> pd.DataFrame:
        """Trims leading/trailing whitespace across all object/string columns."""
        df_clean = df.copy()
        str_cols = df_clean.select_dtypes(include=["object"]).columns
        for col in str_cols:
            df_clean[col] = df_clean[col].astype(str).str.strip()
            # Replace string representations of nulls with actual NaN
            df_clean[col] = df_clean[col].replace(["nan", "None", "NULL", "null", ""], None)
        return df_clean

    @staticmethod
    def deduplicate(
        df: pd.DataFrame,
        subset: List[str],
        keep: str = "last",
    ) -> pd.DataFrame:
        """Removes duplicate rows based on unique key subset."""
        initial_len = len(df)
        df_dedup = df.drop_duplicates(subset=subset, keep=keep).copy()
        removed = initial_len - len(df_dedup)
        if removed > 0:
            logger.info(f"Deduplicated {removed} duplicate rows matching keys: {subset}")
        return df_dedup

    @staticmethod
    def fill_defaults(df: pd.DataFrame, defaults: dict) -> pd.DataFrame:
        """Fills missing values with specified column defaults."""
        return df.fillna(value=defaults)
