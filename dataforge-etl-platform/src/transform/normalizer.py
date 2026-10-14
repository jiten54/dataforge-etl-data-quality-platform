"""Data Normalizer module for DataForge.

Standardizes data formats, casts types safely, and normalizes strings.
"""

from typing import List
import pandas as pd
import numpy as np


class DataNormalizer:
    """Type conversions and canonical standardizations."""

    @staticmethod
    def normalize_dates(df: pd.DataFrame, date_columns: List[str]) -> pd.DataFrame:
        """Parses diverse date formats into standardized MySQL-compatible ISO datetime."""
        df_norm = df.copy()
        for col in date_columns:
            if col in df_norm.columns:
                df_norm[col] = pd.to_datetime(df_norm[col], errors="coerce").dt.strftime("%Y-%m-%d %H:%M:%S")
        return df_norm

    @staticmethod
    def normalize_currency(df: pd.DataFrame, currency_columns: List[str]) -> pd.DataFrame:
        """Cleans currency signs and casts to 2-decimal rounded floats."""
        df_norm = df.copy()
        for col in currency_columns:
            if col in df_norm.columns:
                cleaned = (
                    df_norm[col]
                    .astype(str)
                    .str.replace("$", "", regex=False)
                    .str.replace(",", "", regex=False)
                    .str.strip()
                )
                df_norm[col] = pd.to_numeric(cleaned, errors="coerce").round(2)
        return df_norm

    @staticmethod
    def normalize_phone_numbers(series: pd.Series) -> pd.Series:
        """Normalizes North American phone numbers to standard format (XXX) XXX-XXXX."""
        def format_phone(val):
            if pd.isna(val):
                return None
            digits = "".join([c for c in str(val) if c.isdigit()])
            if len(digits) == 10:
                return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
            elif len(digits) == 11 and digits.startswith("1"):
                return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
            return val
        return series.apply(format_phone)
