"""Unit tests for Schema Validation, Business Quality Rules, and Quarantine Partitioning."""

import pytest
import pandas as pd
from datetime import datetime
from src.validation.schema_validator import SchemaValidator
from src.validation.quality_rules import QualityRules
from src.validation.quarantine import QuarantineManager


def test_schema_validator():
    validator = SchemaValidator(
        required_columns=["id", "name", "price"],
        type_mapping={"id": "int", "name": "str", "price": "float"}
    )

    valid_df = pd.DataFrame({"id": [1], "name": ["Widget"], "price": [10.0]})
    passed, errors = validator.validate_columns(valid_df)
    assert passed is True
    assert len(errors) == 0

    invalid_df = pd.DataFrame({"id": [1], "name": ["Widget"]})
    passed, errors = validator.validate_columns(invalid_df)
    assert passed is False
    assert "Missing required column(s): price" in errors[0]


def test_quality_rules_email_regex():
    emails = pd.Series(["valid.user@example.com", "bad_at_symbol", "user@domain", None, "john@company.co.uk"])
    results = QualityRules.validate_email_syntax(emails)
    assert results.tolist() == [True, False, False, False, True]


def test_quality_rules_positive_number():
    prices = pd.Series([10.50, -5.00, 0.00, "invalid_num"])
    assert QualityRules.validate_positive_number(prices, allow_zero=False).tolist() == [True, False, False, False]
    assert QualityRules.validate_positive_number(prices, allow_zero=True).tolist() == [True, False, True, False]


def test_quality_rules_order_status():
    statuses = pd.Series(["DELIVERED", "pending", "SHIPPED", "FRAUDULENT_STATUS"])
    assert QualityRules.validate_order_status(statuses).tolist() == [True, True, True, False]


def test_quarantine_partition_records():
    raw_df = pd.DataFrame({
        "id": [101, 102, 103],
        "email": ["good@test.com", "bad_email", "another@test.com"],
        "price": [100.0, 50.0, -10.0],
    })

    checks = [
        (QualityRules.validate_email_syntax(raw_df["email"]), "INVALID_EMAIL", "Email syntax invalid"),
        (QualityRules.validate_positive_number(raw_df["price"]), "NEGATIVE_PRICE", "Price must be positive"),
    ]

    valid_df, quar_df = QuarantineManager.partition_records(
        raw_df, checks, "id", "test_entity", "run_123"
    )

    assert len(valid_df) == 1
    assert valid_df["id"].iloc[0] == 101

    assert len(quar_df) == 2
    assert set(quar_df["rejection_code"]) == {"INVALID_EMAIL", "NEGATIVE_PRICE"}
