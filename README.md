# DataForge — Automated ETL & Data Quality Platform

**A modular Python data engineering platform for reliable ETL/ELT pipelines, automated data validation, fault recovery, and MySQL analytics.**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Pandas](https://img.shields.io/badge/Pandas-Data_Processing-150458?logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![NumPy](https://img.shields.io/badge/NumPy-Scientific_Computing-013243?logo=numpy&logoColor=white)](https://numpy.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-REST_API-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Pytest](https://img.shields.io/badge/Testing-Pytest-0A9EDC?logo=pytest&logoColor=white)](https://pytest.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

## Overview

DataForge is a data engineering project designed to demonstrate how raw data can be transformed into validated, consistent, and analytics-ready datasets through a structured pipeline.

It ingests data from CSV files and MySQL sources, applies schema and business-rule validation, separates defective records for investigation, cleans and transforms valid data, and loads results into MySQL using idempotent upserts. A reconciliation layer accounts for extracted, accepted, quarantined, and loaded records.

The project also includes automated tests, structured execution logs, pipeline telemetry, a FastAPI service, a Streamlit monitoring dashboard, Docker-based configuration, and a GitHub Actions workflow.

## Key Features

- **End-to-end ETL/ELT:** Extraction, validation, quarantine, cleaning, transformation, loading, and reconciliation.
- **Multiple source types:** CSV ingestion and MySQL extraction.
- **Incremental extraction:** Timestamp watermark tracking to support delta processing.
- **Data quality validation:** Schema checks, required-field validation, email checks, foreign-key checks, and business-rule enforcement.
- **Quarantine handling:** Preserve rejected records with raw payloads and rejection reasons instead of silently dropping them.
- **Data transformation:** Whitespace normalization, duplicate removal, date and value normalization, and vectorized business calculations.
- **Idempotent loading:** MySQL upserts designed to avoid duplicate inserts when a batch is replayed.
- **Failure recovery:** Staging-table cleanup, transaction rollback, and failure diagnostics.
- **Data reconciliation:** Compare extracted, valid, quarantined, and loaded record counts.
- **Automated testing:** Unit and integration tests using Pytest.
- **Monitoring:** Structured JSON logs, execution timing, memory measurements, and run-level audit records.
- **API and dashboard:** FastAPI endpoints and a Streamlit interface for pipeline operations and monitoring.
- **Containerization and CI:** Docker Compose configuration and GitHub Actions workflow.

## Architecture

```text
CSV Files / MySQL Sources
          |
          v
      Extraction
  CSV + MySQL + Watermarks
          |
          v
   Schema & Quality Checks
          |
          +----------------------+
          |                      |
          v                      v
    Valid Records          Invalid Records
          |                      |
          v                      v
   Clean & Transform        Quarantine Store
          |                 Raw Payload + Reason
          v                      |
     MySQL Loading               |
   Idempotent Upserts            |
          |                      |
          +-----------+----------+
                      |
                      v
              Reconciliation
                      |
                      v
           Logs, Metrics & Audits
                      |
             +--------+--------+
             |                 |
             v                 v
          FastAPI        Streamlit Dashboard
```

## Pipeline Stages

| Stage | Responsibility |
|---|---|
| Extract | Read CSV and MySQL data and support incremental extraction |
| Validate | Check schema, required fields, relationships, and business rules |
| Quarantine | Isolate defective records with traceable rejection reasons |
| Clean | Normalize values and remove duplicate records |
| Transform | Apply business calculations and data transformations |
| Load | Write valid records to MySQL using idempotent upserts |
| Reconcile | Account for input, valid, quarantined, and loaded records |
| Monitor | Record execution status, logs, timing, memory, and audit details |

## Technology Stack

| Category | Technologies |
|---|---|
| Language | Python 3.12 |
| Data processing | pandas, NumPy |
| Database | MySQL 8.0 |
| API | FastAPI |
| Dashboard | Streamlit |
| Testing | Pytest |
| SQL | MySQL DDL, analytical queries, upserts |
| Observability | Structured logging, metrics, reconciliation |
| Deployment | Docker, Docker Compose |
| CI | GitHub Actions |
| Frontend | React, TypeScript |

## Repository Structure

```text
dataforge-etl-platform/
├── src/
│   ├── extract/
│   │   ├── csv_extractor.py
│   │   ├── mysql_extractor.py
│   │   └── watermark.py
│   ├── validation/
│   │   ├── schema_validator.py
│   │   ├── quality_rules.py
│   │   └── quarantine.py
│   ├── transform/
│   │   ├── cleaner.py
│   │   ├── normalizer.py
│   │   └── business_rules.py
│   ├── load/
│   │   ├── idempotent_upsert.py
│   │   ├── mysql_loader.py
│   │   └── recovery.py
│   ├── monitoring/
│   │   ├── logger.py
│   │   ├── metrics.py
│   │   └── reconciliation.py
│   ├── api/
│   │   └── main.py
│   ├── config.py
│   └── pipeline.py
├── sql/
│   ├── schema.sql
│   └── reporting.sql
├── data/
│   └── sample/
├── tests/
│   ├── unit/
│   └── integration/
├── dashboard/
│   └── app.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

*The tree summarizes the supplied project structure. Confirm filenames against the published repository before treating it as an exhaustive file listing.*

## Data Quality and Reliability

DataForge demonstrates a quality-gated approach to data processing.

### Validation

- Required-field and schema checks.
- Email-format validation.
- Primary-key and foreign-key integrity checks.
- Price, quantity, date, and status-rule validation.
- Record-level rejection reasons.

### Quarantine

Invalid records are separated from the normal processing path and stored with their raw payloads and validation reasons. This supports troubleshooting and review without silently discarding source data.

### Idempotent Loading

The MySQL loading layer uses duplicate-key upsert behavior. The intended outcome is that replaying the same batch does not create duplicate business records, provided the target schema and unique-key configuration are correct.

### Reconciliation

The pipeline checks record accounting using the invariant:

```text
Extracted Records = Valid Records + Quarantined Records
```

Loaded or updated records are tracked separately because upserts may update existing records rather than insert new rows.

## Automated Testing

The project includes unit and integration tests intended to cover:

- Source extraction and input handling.
- Data cleaning and transformation.
- Schema and business-rule validation.
- Quarantine behavior.
- MySQL loading and upsert logic.
- End-to-end pipeline execution.
- Idempotent replay and recovery behavior.

Run the test suite from the project environment:

```bash
pytest -v
```

For a coverage report, if `pytest-cov` is installed:

```bash
pytest --cov=src --cov-report=term-missing
```

## Getting Started

### Prerequisites

- Python 3.12
- Docker and Docker Compose
- Git
- MySQL 8.0 if running without the provided containers

### 1. Clone the Repository

```bash
git clone https://github.com/jiten54/dataforge-etl-data-quality-platform.git
cd dataforge-etl-data-quality-platform
```

Replace the repository URL if you choose a different GitHub repository name.

### 2. Configure Environment Variables

Create a local `.env` file based on `.env.example` and configure the database connection and application settings.

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Never commit real passwords, API keys, or production credentials.

### 3. Start the Services

If the Docker Compose configuration is complete:

```bash
docker compose up --build
```

Review the terminal output and health checks to confirm that the database, API, and dashboard start successfully.

### 4. Run Tests

To run tests locally, create and activate a virtual environment, install the project dependencies, and execute:

```bash
pip install -r requirements.txt
pytest -v
```

Use the repository's actual package and import configuration if it requires additional setup.

## Performance Evaluation

The project summary reports the following benchmark results:

| Benchmark | Reported result |
|---|---:|
| Vectorized pandas operations vs. Python loops | 41.8× speedup |
| Batched MySQL upserts | 24.1× speedup |
| Memory reduction with chunked processing | 68% |

These figures should be interpreted as workload-specific measurements, not universal performance guarantees. Publish the test data, baseline implementation, measurement method, and repeatable benchmark commands alongside them so reviewers can validate the results.

## API and Monitoring

The supplied project summary lists API operations for:

- Triggering a pipeline run.
- Checking the status of a run.
- Retrieving data-quality summaries.
- Checking service health.

The FastAPI service is intended to expose these operations, while the Streamlit dashboard provides a visual view of pipeline execution and operational telemetry.

Confirm the actual routes and dashboard URL in the running application before documenting public endpoints.

## Engineering Concepts Demonstrated

- Modular Python architecture.
- Relational database integration.
- ETL/ELT design and incremental processing.
- Data validation and data-quality controls.
- Idempotency and recovery.
- Automated unit and integration testing.
- SQL-based analytics and reporting.
- Logging, monitoring, and reconciliation.
- Containerization and CI workflows.
- Performance measurement and optimization.

## Future Improvements

Potential extensions include:

- Scheduling pipelines with Airflow or Prefect.
- Adding schema evolution and data contracts.
- Supporting cloud object storage and warehouse destinations.
- Adding richer alerting and operational dashboards.
- Introducing configurable retry policies and dead-letter replay.
- Adding data lineage and versioned quality rules.

These are potential extensions, not claims about current functionality.

## Why DataForge?

DataForge was designed to explore practical data engineering problems: processing imperfect data, enforcing quality rules, preventing duplicate loads, recovering from failures, and making pipeline results auditable.

It is a portfolio project demonstrating the engineering concepts relevant to Python data processing and database-driven ETL/ELT systems.

## Author

**Jiten Moni Das**  
B.Sc. Information Technology

- GitHub: [jiten54](https://github.com/jiten54)
- LinkedIn: [Jiten Moni Das](https://www.linkedin.com/in/jiten-moni-das-01b3a032b/)

---

**Project:** DataForge — Automated ETL & Data Quality Platform  
**Focus:** Python · SQL · MySQL · ETL/ELT · Data Quality · Pytest · FastAPI · Docker
