"""Watermark Manager for Incremental ETL Processing.

Stores and retrieves the high-watermark timestamp per source entity
to prevent reprocessing historical data while guaranteeing no lost records.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict


class WatermarkManager:
    """Manages persistent high-watermarks for incremental ELT extraction."""

    def __init__(self, storage_path: Path):
        self.storage_path = Path(storage_path)
        self.watermarks: Dict[str, str] = {}
        self._load()

    def _load(self) -> None:
        """Loads watermarks from disk or initializes an empty dict."""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self.watermarks = json.load(f)
            except Exception:
                self.watermarks = {}
        else:
            self.watermarks = {}

    def _save(self) -> None:
        """Persists current watermarks to disk safely."""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.storage_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(self.watermarks, f, indent=2)
        temp_path.replace(self.storage_path)

    def get_watermark(self, entity_name: str) -> Optional[datetime]:
        """Returns the last saved high-watermark datetime for the entity."""
        ts_str = self.watermarks.get(entity_name)
        if ts_str:
            try:
                return datetime.fromisoformat(ts_str)
            except ValueError:
                return None
        return None

    def update_watermark(self, entity_name: str, new_watermark: datetime) -> None:
        """Updates and persists the high-watermark timestamp for the entity."""
        self.watermarks[entity_name] = new_watermark.isoformat()
        self._save()

    def reset_watermark(self, entity_name: str) -> None:
        """Resets the watermark to reprocess data from beginning."""
        if entity_name in self.watermarks:
            del self.watermarks[entity_name]
            self._save()
