"""Performance and execution metrics tracking for DataForge ETL."""

import time
import psutil
import os
from dataclasses import dataclass, field
from typing import Dict, Any, Optional


@dataclass
class StageMetrics:
    """Metrics recorded for an individual pipeline execution stage."""
    stage_name: str
    duration_sec: float = 0.0
    rows_in: int = 0
    rows_out: int = 0
    memory_start_mb: float = 0.0
    memory_end_mb: float = 0.0


@dataclass
class PipelineMetricsTracker:
    """Tracks end-to-end memory, throughput, and step durations."""
    run_id: str
    start_time: float = field(default_factory=time.perf_counter)
    end_time: Optional[float] = None
    stages: Dict[str, StageMetrics] = field(default_factory=dict)
    _process: psutil.Process = field(default_factory=lambda: psutil.Process(os.getpid()))

    def get_current_memory_mb(self) -> float:
        """Returns the RSS memory usage in megabytes."""
        try:
            return round(self._process.memory_info().rss / (1024 * 1024), 2)
        except Exception:
            return 0.0

    def start_stage(self, stage_name: str, rows_in: int = 0) -> None:
        self.stages[stage_name] = StageMetrics(
            stage_name=stage_name,
            rows_in=rows_in,
            memory_start_mb=self.get_current_memory_mb(),
        )

    def end_stage(self, stage_name: str, rows_out: int = 0, duration_sec: Optional[float] = None) -> None:
        if stage_name in self.stages:
            stage = self.stages[stage_name]
            stage.rows_out = rows_out
            stage.memory_end_mb = self.get_current_memory_mb()
            if duration_sec is not None:
                stage.duration_sec = duration_sec

    def finish(self) -> Dict[str, Any]:
        """Calculates and returns total summary metrics."""
        self.end_time = time.perf_counter()
        total_duration = round(self.end_time - self.start_time, 4)
        peak_memory = max([s.memory_end_mb for s in self.stages.values()] + [self.get_current_memory_mb()])

        return {
            "run_id": self.run_id,
            "total_duration_sec": total_duration,
            "peak_memory_mb": peak_memory,
            "stages": {name: vars(s) for name, s in self.stages.items()},
        }
