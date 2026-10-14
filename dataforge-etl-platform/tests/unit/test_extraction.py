"""Unit tests for CSV and Watermark extraction components."""

import pytest
import pandas as pd
from pathlib import Path
from datetime import datetime
from src.extract.csv_extractor import CSVExtractor
from src.extract.watermark import WatermarkManager


@pytest.fixture
def sample_csv(tmp_path: Path) -> Path:
    csv_file = tmp_path / "test_extract.csv"
    csv_file.write_text("id,name,value\n1,Alpha,100\n2,Beta,200\n3,Gamma,300\n")
    return csv_file


def test_csv_extractor_reads_full_dataset(sample_csv: Path):
    extractor = CSVExtractor(sample_csv)
    df = extractor.extract_full()
    assert len(df) == 3
    assert list(df.columns) == ["id", "name", "value"]
    assert df["name"].tolist() == ["Alpha", "Beta", "Gamma"]


def test_csv_extractor_chunking(sample_csv: Path):
    extractor = CSVExtractor(sample_csv, batch_size=2)
    chunks = list(extractor.extract_batches())
    assert len(chunks) == 2
    assert len(chunks[0]) == 2
    assert len(chunks[1]) == 1


def test_watermark_persistence(tmp_path: Path):
    watermark_file = tmp_path / "watermarks.json"
    wm = WatermarkManager(watermark_file)
    assert wm.get_watermark("orders") is None

    test_time = datetime(2024, 3, 15, 12, 0, 0)
    wm.update_watermark("orders", test_time)

    # Reload from fresh instance
    wm_reloaded = WatermarkManager(watermark_file)
    assert wm_reloaded.get_watermark("orders") == test_time
