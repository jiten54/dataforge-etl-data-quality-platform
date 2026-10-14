"""Data Quality Rules Engine for DataForge.

Implements granular business rule checks:
- Email syntax validation
- Positive prices and quantities
- Allowed status enums
- Foreign key referential checks
- Reasonable date boundaries (no future orders, not before 2000)
"""

import re
from datetime import datetime
from typing import Set, Optional
import numpy as np
import pandas as pd


class QualityRules:
    """Vectorized and declarative data quality validation rules."""

    EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
    VALID_ORDER_STATUSES: Set[str] = {
        "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"
    }
    VALID_CUSTOMER_TIERS: Set[str] = {"BRONZE", "SILVER", "GOLD", "PLATINUM"}

    @staticmethod
    def validate_email_syntax(emails: pd.Series) -> pd.Series:
        """Vectorized regex check for email validity."""
        def check_email(val):
            if pd.isna(val) or not isinstance(val, str):
                return False
            return bool(QualityRules.EMAIL_REGEX.match(val.strip()))
        return emails.apply(check_email)

    @staticmethod
    def validate_positive_number(series: pd.Series, allow_zero: bool = False) -> pd.Series:
        """Verifies numbers are strictly positive (or non-negative if allow_zero=True)."""
        numeric_series = pd.to_numeric(series, errors="coerce")
        if allow_zero:
            return numeric_series >= 0.0
        return numeric_series > 0.0

    @staticmethod
    def validate_order_status(statuses: pd.Series) -> pd.Series:
        """Verifies order status matches allowed business enumeration."""
        return statuses.astype(str).str.upper().str.strip().isin(QualityRules.VALID_ORDER_STATUSES)

    @staticmethod
    def validate_order_date_range(dates: pd.Series, max_date: Optional[datetime] = None) -> pd.Series:
        """Checks that dates are parseable, not in future, and after Jan 1, 2020."""
        parsed_dates = pd.to_datetime(dates, errors="coerce")
        min_boundary = pd.Timestamp("2020-01-01")
        max_boundary = pd.Timestamp(max_date or datetime.now())

        return (
            parsed_dates.notna()
            & (parsed_dates >= min_boundary)
            & (parsed_dates <= max_boundary)
        )

    @staticmethod
    def validate_foreign_key(keys: pd.Series, valid_parent_keys: Set[Any]) -> pd.Series:
        """Checks referential integrity against a set of valid parent keys."""
        return keys.isin(valid_parent_keys)
