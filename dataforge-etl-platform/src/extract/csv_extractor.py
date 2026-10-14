"""CSV Extractor module for DataForge.

Extracts data from raw CSV feeds with support for batching, schema typing hints,
and handling malformed lines.
"""

from pathlib import Path
from typing import Iterator, Optional, Dict, Any
import pandas as pd
from src.monitoring.logger import logger


class CSVExtractor:
    """Extracts raw datasets from flat CSV files with chunking support."""

    def __init__(self, file_path: Path, batch_size: int = 1000):
        self.file_path = Path(file_path)
        self.batch_size = batch_size

    def extract_full(self, dtype_spec: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """Reads the entire CSV file into a Pandas DataFrame."""
        if not self.file_path.exists():
            raise FileNotFoundError(f"Source file not found at: {self.file_path}")

        logger.info(f"Extracting CSV data from {self.file_path}")
        df = pd.read_csv(
            self.file_path,
            dtype=dtype_spec,
            keep_default_na=True,
            on_bad_lines="warn",
        )
        logger.info(f"Successfully extracted {len(df)} rows from {self.file_path.name}")
        return df

    def extract_batches(self, dtype_spec: Optional[Dict[str, Any]] = None) -> Iterator[pd.DataFrame]:
        """Streams CSV data in configurable batch sizes to bound memory consumption."""
        if not self.file_path.exists():
            raise FileNotFoundError(f"Source file not found at: {self.file_path}")

        logger.info(f"Streaming CSV data from {self.file_path} in chunks of {self.batch_size}")
        reader = pd.read_csv(
            self.file_path,
            chunksize=self.batch_size,
            dtype=dtype_spec,
            on_bad_lines="warn",
        )
        for chunk in reader:
            yield chunk
