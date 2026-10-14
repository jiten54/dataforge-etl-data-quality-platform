/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { PipelineWorkbench } from './components/PipelineWorkbench';
import { DataQualityQuarantine } from './components/DataQualityQuarantine';
import { SqlExplorer } from './components/SqlExplorer';
import { PerformanceBenchmarks } from './components/PerformanceBenchmarks';
import { PytestRunner } from './components/PytestRunner';
import { ApiSandbox } from './components/ApiSandbox';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { AthenaAlignmentModal } from './components/AthenaAlignmentModal';
import { 
  INITIAL_PIPELINE_RUNS, 
  INITIAL_QUARANTINE_RECORDS 
} from './data/sampleData';
import { PipelineRun, QuarantinedRecord, StageLog } from './types/dataforge';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('workbench');
  const [isAlignmentModalOpen, setIsAlignmentModalOpen] = useState<boolean>(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);

  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(INITIAL_PIPELINE_RUNS[0]);
  const [recentRuns, setRecentRuns] = useState<PipelineRun[]>(INITIAL_PIPELINE_RUNS);
  const [quarantineRecords, setQuarantineRecords] = useState<QuarantinedRecord[]>(INITIAL_QUARANTINE_RECORDS);

  const [stageLogs, setStageLogs] = useState<StageLog[]>([
    { stage: 'extract', duration_ms: 184, rows_in: 0, rows_out: 45, status: 'success', message: 'Extracted 45 rows across 4 CSV source entities.' },
    { stage: 'validate', duration_ms: 122, rows_in: 45, rows_out: 36, status: 'success', message: 'Schema & Quality Rules evaluated; 9 invalid records identified.' },
    { stage: 'quarantine', duration_ms: 45, rows_in: 9, rows_out: 9, status: 'success', message: 'Written 9 defective records to quarantined_records with JSON payloads.' },
    { stage: 'clean', duration_ms: 68, rows_in: 36, rows_out: 36, status: 'success', message: 'Whitespace stripped and primary key deduplication applied.' },
    { stage: 'transform', duration_ms: 89, rows_in: 36, rows_out: 36, status: 'success', message: 'Vectorized margin & customer tier calculation executed.' },
    { stage: 'load', duration_ms: 420, rows_in: 36, rows_out: 36, status: 'success', message: 'Batched idempotent upsert (ON DUPLICATE KEY UPDATE) into MySQL.' },
    { stage: 'reconcile', duration_ms: 25, rows_in: 45, rows_out: 45, status: 'success', message: 'Reconciliation balanced: Extracted (45) == Valid (36) + Quarantined (9).' }
  ]);

  const handleExecutePipeline = (scenario: 'dirty' | 'idempotent' | 'incremental' | 'fault') => {
    setIsRunningPipeline(true);
    setStageLogs([]);

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const runId = `run_${Math.random().toString(36).substring(2, 10)}`;
    const batchId = `batch_${timestamp}`;

    // Stage simulation steps
    const simulatedStages: { stage: StageLog['stage']; delay: number; log: Partial<StageLog> }[] = [
      {
        stage: 'extract',
        delay: 200,
        log: {
          rows_in: 0,
          rows_out: scenario === 'incremental' ? 24 : 45,
          message: scenario === 'incremental'
            ? 'Delta query executed: Extracted 24 rows with updated_at > last_watermark.'
            : 'Extracted 45 raw records from customers, products, orders, and order_items CSVs.',
          details: ['CSV chunking active (chunksize=1000)', 'Watermark check: 2024-04-01T00:00:00']
        }
      },
      {
        stage: 'validate',
        delay: 450,
        log: {
          rows_in: scenario === 'incremental' ? 24 : 45,
          rows_out: scenario === 'dirty' ? 36 : scenario === 'fault' ? 0 : 24,
          message: scenario === 'fault'
            ? 'Simulating validation failure on corrupted entity payload.'
            : scenario === 'dirty'
            ? 'Quality rules completed: 9 records failed validation gating.'
            : 'All rows passed schema & quality rule checks.',
          details: ['Email regex validation', 'Price positive bound (>0)', 'Foreign key referential check']
        }
      },
      {
        stage: 'quarantine',
        delay: 700,
        log: {
          rows_in: scenario === 'dirty' ? 9 : 0,
          rows_out: scenario === 'dirty' ? 9 : 0,
          message: scenario === 'dirty'
            ? 'Segregated 9 records into dead-letter storage with failure diagnosis.'
            : '0 records quarantined for this clean batch.',
          details: ['Written to quarantined_records', 'Zero silent data drops enforced']
        }
      },
      {
        stage: 'clean',
        delay: 950,
        log: {
          rows_in: 36,
          rows_out: 36,
          message: 'Trimmed whitespace across string columns; deduplicated key collisions.',
          details: ['Pandas vectorized drop_duplicates()', 'Normalized nulls to None']
        }
      },
      {
        stage: 'transform',
        delay: 1200,
        log: {
          rows_in: 36,
          rows_out: 36,
          message: 'Calculated line item margins and customer loyalty tiers via NumPy np.select.',
          details: ['SIMD vectorization enabled', 'Date format ISO 8601 standardized']
        }
      },
      {
        stage: 'load',
        delay: 1550,
        log: {
          rows_in: 36,
          rows_out: scenario === 'fault' ? 0 : 36,
          message: scenario === 'fault'
            ? 'DATABASE TRANSACTION ERROR: Lock wait timeout exceeded.'
            : scenario === 'idempotent'
            ? 'Idempotent upsert finished: 36 records updated, 0 duplicate keys created.'
            : 'Batched INSERT ... ON DUPLICATE KEY UPDATE executed into MySQL DW.',
          details: scenario === 'fault'
            ? ['Rolling back database transaction', 'Purging staging table buffer', 'RecoveryManager triggered']
            : ['Target: dim_customers, dim_products, fct_orders', 'Batch commit successful']
        }
      },
      {
        stage: 'reconcile',
        delay: 1850,
        log: {
          rows_in: 45,
          rows_out: 45,
          message: scenario === 'fault'
            ? 'Recovery verified: Warehouse state preserved without corruption.'
            : 'Reconciliation balanced: Conservation of rows verified 100%.',
          details: ['Audited in pipeline_runs', 'SLA recorded: < 2.0s']
        }
      }
    ];

    simulatedStages.forEach((step) => {
      setTimeout(() => {
        const isFaultStep = scenario === 'fault' && (step.stage === 'load');
        setStageLogs(prev => [
          ...prev,
          {
            stage: step.stage,
            duration_ms: Math.floor(Math.random() * 80 + 30),
            rows_in: step.log.rows_in || 0,
            rows_out: step.log.rows_out || 0,
            status: isFaultStep ? 'failed' : 'success',
            message: step.log.message || '',
            details: step.log.details
          }
        ]);
      }, step.delay);
    });

    // Finalize run
    setTimeout(() => {
      setIsRunningPipeline(false);
      const isFailed = scenario === 'fault';
      const newRun: PipelineRun = {
        run_id: runId,
        batch_id: batchId,
        status: isFailed ? 'RECOVERED' : 'COMPLETED',
        source_type: scenario === 'incremental' ? 'Incremental Delta' : scenario === 'idempotent' ? 'Idempotent Replay' : 'CSV Feeds',
        rows_extracted: scenario === 'incremental' ? 24 : 45,
        rows_valid: isFailed ? 0 : scenario === 'dirty' ? 36 : 24,
        rows_quarantined: scenario === 'dirty' ? 9 : 0,
        rows_loaded: isFailed ? 0 : scenario === 'dirty' ? 36 : 24,
        rows_updated: scenario === 'idempotent' ? 36 : 2,
        execution_duration_sec: Number((Math.random() * 0.4 + 1.1).toFixed(4)),
        memory_peak_mb: Number((Math.random() * 6 + 44).toFixed(1)),
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        error_message: isFailed ? 'Simulated Database Lock: Safe staging purge verified.' : undefined,
        reconciliation: {
          customers: { extracted: 14, valid: 11, quarantined: scenario === 'dirty' ? 3 : 0, loaded: 10, is_balanced: true, discrepancy: 0 },
          products: { extracted: 11, valid: 8, quarantined: scenario === 'dirty' ? 3 : 0, loaded: 8, is_balanced: true, discrepancy: 0 },
          orders: { extracted: 14, valid: 10, quarantined: scenario === 'dirty' ? 4 : 0, loaded: 10, is_balanced: true, discrepancy: 0 },
          order_items: { extracted: 16, valid: 13, quarantined: scenario === 'dirty' ? 3 : 0, loaded: 13, is_balanced: true, discrepancy: 0 },
        }
      };

      setCurrentRun(newRun);
      setRecentRuns(prev => [newRun, ...prev.slice(0, 9)]);
    }, 2000);
  };

  const handleToggleResolveQuarantine = (id: number) => {
    setQuarantineRecords(prev => prev.map(r => r.quarantine_id === id ? { ...r, resolved: !r.resolved } : r));
  };

  const handleClearResolvedQuarantine = () => {
    setQuarantineRecords(prev => prev.filter(r => !r.resolved));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAlignmentModal={() => setIsAlignmentModalOpen(true)}
        isRunningPipeline={isRunningPipeline}
        onTriggerQuickRun={() => handleExecutePipeline('dirty')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'workbench' && (
          <PipelineWorkbench
            currentRun={currentRun}
            isRunning={isRunningPipeline}
            onExecutePipeline={handleExecutePipeline}
            stageLogs={stageLogs}
            recentRuns={recentRuns}
          />
        )}

        {activeTab === 'quarantine' && (
          <DataQualityQuarantine
            quarantineRecords={quarantineRecords}
            onToggleResolve={handleToggleResolveQuarantine}
            onClearResolved={handleClearResolvedQuarantine}
          />
        )}

        {activeTab === 'sql' && (
          <SqlExplorer />
        )}

        {activeTab === 'benchmarks' && (
          <PerformanceBenchmarks />
        )}

        {activeTab === 'pytest' && (
          <PytestRunner />
        )}

        {activeTab === 'api' && (
          <ApiSandbox />
        )}

        {activeTab === 'codebase' && (
          <CodebaseExplorer />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DataForge ETL Platform · Designed for Athena Tech Data Engineer Specification</span>
          <div className="flex items-center gap-2">
            <span>MySQL 8.0</span>
            <span aria-hidden="true">·</span>
            <span>Pandas 2.2</span>
            <span aria-hidden="true">·</span>
            <span>NumPy 1.26</span>
            <span aria-hidden="true">·</span>
            <span>Pytest 8.1</span>
            <span aria-hidden="true">·</span>
            <span>Docker Compose</span>
          </div>
        </div>
      </footer>

      {/* Athena Tech Alignment Modal */}
      <AthenaAlignmentModal
        isOpen={isAlignmentModalOpen}
        onClose={() => setIsAlignmentModalOpen(false)}
      />
    </div>
  );
}
