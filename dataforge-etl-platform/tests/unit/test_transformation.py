"""Unit tests for Cleaning, Normalization, and Business Rules transformations."""

import pytest
import pandas as pd
import numpy as np
from src.transform.cleaner import DataCleaner
from src.transform.normalizer import DataNormalizer
from src.transform.business_rules import BusinessRulesTransformer


def test_cleaner_strip_and_deduplicate():
    raw_data = pd.DataFrame({
        "customer_id": [1, 2, 2, 3],
        "name": ["  Alice  ", "Bob", "Bob ", " Charlie"],
        "status": ["active", " NULL ", "pending", "active"]
    })

    cleaned = DataCleaner.strip_string_columns(raw_data)
    assert cleaned["name"].tolist() == ["Alice", "Bob", "Bob", "Charlie"]
    assert cleaned["status"].iloc[1] is None

    deduped = DataCleaner.deduplicate(cleaned, subset=["customer_id"], keep="last")
    assert len(deduped) == 3
    assert deduped["customer_id"].tolist() == [1, 2, 3]


def test_normalizer_currency_and_dates():
    df = pd.DataFrame({
        "price_str": ["$1,250.50", " $49.99 ", "100"],
        "date_str": ["2024-01-15 10:30:00", "02/20/2024", "invalid_date"],
    })

    curr_norm = DataNormalizer.normalize_currency(df, ["price_str"])
    assert curr_norm["price_str"].tolist() == [1250.50, 49.99, 100.00]

    date_norm = DataNormalizer.normalize_dates(df, ["date_str"])
    assert date_norm["date_str"].iloc[0] == "2024-01-15 10:30:00"
    assert date_norm["date_str"].iloc[2] is None or pd.isna(date_norm["date_str"].iloc[2])


def test_business_rules_order_item_totals():
    items = pd.DataFrame({
        "order_item_id": [1, 2],
        "product_id": [101, 102],
        "quantity": [2, 3],
        "unit_price": [10.00, 25.00],
    })
    products = pd.DataFrame({
        "product_id": [101, 102],
        "cost_price": [6.00, 15.00],
    })

    enriched = BusinessRulesTransformer.calculate_order_item_totals(items, products)
    assert enriched["line_total"].tolist() == [20.00, 75.00]
    # margin = line_total - (quantity * cost_price) = 20 - 12 = 8, 75 - 45 = 30
    assert enriched["gross_margin"].tolist() == [8.00, 30.00]


def test_customer_tier_assignment():
    customers = pd.DataFrame({
        "customer_id": [1, 2, 3],
        "first_name": ["Low", "Mid", "High"]
    })
    orders = pd.DataFrame({
        "customer_id": [1, 2, 3],
        "order_status": ["DELIVERED", "DELIVERED", "DELIVERED"],
        "total_amount": [50.00, 450.00, 3200.00],
    })

    tiered = BusinessRulesTransformer.assign_customer_tiers(customers, orders)
    assert tiered["customer_tier"].tolist() == ["BRONZE", "SILVER", "PLATINUM"]
