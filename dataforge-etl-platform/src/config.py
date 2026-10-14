"""Configuration Manager for DataForge ETL Platform.

Handles environment variable resolution, default fallbacks, and typed settings
using Pydantic / dotenv.
"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load local .env if present
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class Config:
    """Application configuration container."""

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Database Settings
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "dataforge_user")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "dataforge_secure_pass_2026")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "dataforge_dw")

    # Test Database Settings
    TEST_MYSQL_HOST: str = os.getenv("TEST_MYSQL_HOST", "localhost")
    TEST_MYSQL_PORT: int = int(os.getenv("TEST_MYSQL_PORT", "3306"))
    TEST_MYSQL_USER: str = os.getenv("TEST_MYSQL_USER", "dataforge_user")
    TEST_MYSQL_PASSWORD: str = os.getenv("TEST_MYSQL_PASSWORD", "dataforge_secure_pass_2026")
    TEST_MYSQL_DATABASE: str = os.getenv("TEST_MYSQL_DATABASE", "dataforge_test_dw")

    # Pipeline Batch & Performance
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "1000"))
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    RETRY_BACKOFF_FACTOR: int = int(os.getenv("RETRY_BACKOFF_FACTOR", "2"))

    # File & Directory Paths
    BASE_DIR: Path = ROOT_DIR
    DATA_RAW_DIR: Path = ROOT_DIR / os.getenv("DATA_RAW_DIR", "data/sample")
    REPORTS_DIR: Path = ROOT_DIR / os.getenv("REPORTS_DIR", "reports")
    QUARANTINE_DIR: Path = ROOT_DIR / os.getenv("QUARANTINE_DIR", "data/quarantine")
    WATERMARK_STORE_PATH: Path = ROOT_DIR / os.getenv("WATERMARK_STORE_PATH", "data/watermarks.json")

    # API Settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    @classmethod
    def get_database_url(cls, is_test: bool = False) -> str:
        """Constructs an SQLAlchemy compatible MySQL connection URL."""
        if is_test:
            return (
                f"mysql+pymysql://{cls.TEST_MYSQL_USER}:{cls.TEST_MYSQL_PASSWORD}@"
                f"{cls.TEST_MYSQL_HOST}:{cls.TEST_MYSQL_PORT}/{cls.TEST_MYSQL_DATABASE}"
            )
        return (
            f"mysql+pymysql://{cls.MYSQL_USER}:{cls.MYSQL_PASSWORD}@"
            f"{cls.MYSQL_HOST}:{cls.MYSQL_PORT}/{cls.MYSQL_DATABASE}"
        )


config = Config()
