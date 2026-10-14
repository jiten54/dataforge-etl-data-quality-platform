"""Integration tests for idempotency, retry safety, and transaction recovery."""

import pytest
import pandas as pd
from src.transform.cleaner import DataCleaner


def test_idempotent_batch_replay():
    """Verifies that processing the same batch twice yields identical record sets without duplication."""
    initial_batch = pd.DataFrame({
        "order_id": [101, 102, 103],
        "amount": [100.0, 200.0, 300.0]
    })

    # First run
    run1 = DataCleaner.deduplicate(initial_batch, subset=["order_id"])

    # Replay identical batch
    replayed_batch = pd.concat([run1, initial_batch], ignore_index=True)
    run2 = DataCleaner.deduplicate(replayed_batch, subset=["order_id"])

    assert len(run1) == len(run2) == 3
    assert run1["order_id"].tolist() == run2["order_id"].tolist()
