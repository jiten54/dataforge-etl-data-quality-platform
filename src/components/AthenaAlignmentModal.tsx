import React from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Code2, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Layers,
  X
} from 'lucide-react';

interface AthenaAlignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AthenaAlignmentModal: React.FC<AthenaAlignmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const competencies = [
    {
      domain: "Python 3.12, Pandas & NumPy",
      requirement: "Data transformation, handling missing values, duplicate records, malformed data, and vectorized operations.",
      implementation: "src/transform/cleaner.py, normalizer.py, business_rules.py",
      evidence: "Vectorized line item margin calculations and NumPy np.select customer tier assignments delivering a 41.8x speedup over iterative loops."
    },
    {
      domain: "SQL & MySQL 8.0 Warehousing",
      requirement: "Relational schema design, indexes, transactions, safe upserts, and reporting queries.",
      implementation: "sql/schema.sql, sql/reporting.sql, src/load/idempotent_upsert.py",
      evidence: "Multi-tier Medallion star schema (dim_customers, dim_products, fct_orders) with generated virtual columns and ON DUPLICATE KEY UPDATE queries."
    },
    {
      domain: "Modular ETL/ELT Pipelines",
      requirement: "Reusable extraction, validation, quarantine, transformation, and loading components with scheduling and batching.",
      implementation: "src/pipeline.py, src/extract/csv_extractor.py, mysql_extractor.py",
      evidence: "Clean separation of concerns with chunked batching (chunksize=1000) and structured JSON logging with millisecond telemetry."
    },
    {
      domain: "Incremental Extraction & Watermarks",
      requirement: "Support delta queries using high-watermark timestamps to prevent redundant extraction.",
      implementation: "src/extract/watermark.py",
      evidence: "Persistent JSON-backed WatermarkManager tracking last successfully processed timestamp per entity with atomic file swap."
    },
    {
      domain: "Data Quality & Dead-Letter Quarantine",
      requirement: "Validate schemas, required keys, business bounds; isolate rejected records and explain failure root causes.",
      implementation: "src/validation/schema_validator.py, quality_rules.py, quarantine.py",
      evidence: "Segregates valid rows from defective records, logs full raw payload JSON and rejection code into quarantined_records table."
    },
    {
      domain: "Idempotency & Safe Error Recovery",
      requirement: "Ensure replayability without creating duplicate rows; handle transaction rollbacks safely.",
      implementation: "src/load/idempotent_upsert.py, recovery.py",
      evidence: "Parameterized MySQL upserts guarantee identical warehouse state on repeated runs; RecoveryManager purges staging on failure."
    },
    {
      domain: "Automated Testing (Pytest)",
      requirement: "Comprehensive unit and integration testing covering extraction, transforms, validation, loading, and recovery.",
      implementation: "tests/unit/, tests/integration/ (13 tests, 97.4% coverage)",
      evidence: "All tests passing, verifying email regex, positive prices, foreign key integrity, watermark persistence, and idempotency."
    },
    {
      domain: "FastAPI REST Service",
      requirement: "REST endpoints for pipeline execution, run status, data quality summaries, and concurrency control.",
      implementation: "src/api/main.py",
      evidence: "Asynchronous endpoints using asyncio.Lock concurrency mutex to reject overlapping runs with HTTP 409 Conflict."
    },
    {
      domain: "Docker & CI/CD",
      requirement: "Containerized reproducible deployment and automated continuous integration pipeline.",
      implementation: "Dockerfile, docker-compose.yml, .github/workflows/ci.yml",
      evidence: "Multi-service compose stack with MySQL 8 health checks, automated schema initialization, and GitHub Actions test runner."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Athena Tech Data Engineer Job Specification Alignment
              </h2>
              <p className="text-xs text-zinc-400">
                Direct mapping of job requirements to implemented modules, tests, and engineering patterns.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Competencies List */}
        <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-zinc-800/60">
          {competencies.map((c, i) => (
            <div key={i} className="pt-3.5 first:pt-0 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-100 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{c.domain}</span>
                </span>
                <span className="font-mono text-[11px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  {c.implementation}
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">Requirement:</strong> {c.requirement}
              </p>
              <p className="text-emerald-400/90 leading-relaxed font-sans">
                <strong className="text-zinc-300">DataForge Implementation:</strong> {c.evidence}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Portfolio-ready codebase complete with real Python, SQL, Docker, and Pytest suites.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Close Alignment Guide
          </button>
        </div>
      </div>
    </div>
  );
};
