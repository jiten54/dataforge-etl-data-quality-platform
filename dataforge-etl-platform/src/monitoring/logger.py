"""Structured logging module for DataForge ETL Platform."""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    """Custom formatter outputting logs as structured JSON strings."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno,
        }
        if hasattr(record, "run_id"):
            log_obj["run_id"] = record.run_id
        if hasattr(record, "batch_id"):
            log_obj["batch_id"] = record.batch_id
        if hasattr(record, "extra_data"):
            log_obj["extra"] = record.extra_data
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def setup_logger(name: str = "dataforge", level: str = "INFO") -> logging.Logger:
    """Configures and returns a production-ready structured logger."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Prevent duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)

    return logger


logger = setup_logger()
