"""Unit tests for Idempotent SQL query construction and loading utilities."""

import pytest
from src.load.idempotent_upsert import IdempotentUpsert


def test_build_upsert_query():
    sql = IdempotentUpsert.build_upsert_query(
        table_name="dim_customers",
        columns=["customer_id", "first_name", "last_name", "email"],
        primary_keys=["customer_id"],
    )

    assert "INSERT INTO dim_customers (customer_id, first_name, last_name, email)" in sql
    assert "VALUES (:customer_id, :first_name, :last_name, :email)" in sql
    assert "ON DUPLICATE KEY UPDATE" in sql
    assert "first_name = VALUES(first_name)" in sql
    assert "email = VALUES(email)" in sql
    assert "customer_id = VALUES(customer_id)" not in sql
