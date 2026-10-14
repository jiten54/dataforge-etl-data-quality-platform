export interface PipelineRun {
  run_id: string;
  batch_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RECOVERED';
  source_type: string;
  rows_extracted: number;
  rows_valid: number;
  rows_quarantined: number;
  rows_loaded: number;
  rows_updated: number;
  execution_duration_sec: number;
  memory_peak_mb: number;
  created_at: string;
  error_message?: string;
  reconciliation?: {
    [entity: string]: {
      extracted: number;
      valid: number;
      quarantined: number;
      loaded: number;
      is_balanced: boolean;
      discrepancy: number;
    };
  };
}

export interface QuarantinedRecord {
  quarantine_id: number;
  run_id: string;
  entity_name: 'customers' | 'products' | 'orders' | 'order_items';
  natural_key: string;
  rejection_code: string;
  rejection_reason: string;
  raw_payload: Record<string, any>;
  quarantined_at: string;
  resolved: boolean;
}

export interface StageLog {
  stage: 'extract' | 'validate' | 'quarantine' | 'clean' | 'transform' | 'load' | 'reconcile';
  duration_ms: number;
  rows_in: number;
  rows_out: number;
  status: 'success' | 'running' | 'failed' | 'pending';
  message: string;
  details?: string[];
}

export interface BenchmarkResult {
  operation: string;
  baselineTimeMs: number;
  optimizedTimeMs: number;
  speedupMultiplier: number;
  baselineMemoryMb: number;
  optimizedMemoryMb: number;
  rowsCount: number;
  throughputRowsSec: number;
}

export interface PytestCase {
  id: string;
  name: string;
  suite: 'unit' | 'integration';
  file: string;
  duration_ms: number;
  status: 'passed' | 'failed' | 'running';
  assertCount: number;
  details: string;
}

export interface SqlReportQuery {
  id: string;
  title: string;
  description: string;
  sql: string;
  columns: string[];
  rows: Record<string, any>[];
  explainPlan: string;
}
