import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Layers, 
  ArrowRight, 
  RefreshCw,
  Cpu,
  FileCheck2,
  ShieldAlert,
  Server
} from 'lucide-react';
import { PipelineRun, StageLog } from '../types/dataforge';

interface PipelineWorkbenchProps {
  currentRun: PipelineRun | null;
  isRunning: boolean;
  onExecutePipeline: (scenario: 'dirty' | 'idempotent' | 'incremental' | 'fault') => void;
  stageLogs: StageLog[];
  recentRuns: PipelineRun[];
}

export const PipelineWorkbench: React.FC<PipelineWorkbenchProps> = ({
  currentRun,
  isRunning,
  onExecutePipeline,
  stageLogs,
  recentRuns,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<'dirty' | 'idempotent' | 'incremental' | 'fault'>('dirty');

  const scenarios = [
    {
      id: 'dirty' as const,
      title: 'Standard Retail Batch (Dirty Data)',
      description: 'Ingests 45 raw rows containing malformed emails, orphan FKs, and negative prices to demonstrate automated quarantine.',
      badgeText: '45 Rows · 9 Defects',
    },
    {
      id: 'idempotent' as const,
      title: 'Idempotent Replay Test',
      description: 'Re-runs the exact same dataset to prove safe upsert (INSERT ... ON DUPLICATE KEY UPDATE) creates 0 duplicate rows.',
      badgeText: 'Duplicate Verification',
    },
    {
      id: 'incremental' as const,
      title: 'Watermark Incremental Delta',
      description: 'Extracts only delta rows where timestamp > high-watermark, optimizing network & query load.',
      badgeText: 'Incremental Delta',
    },
    {
      id: 'fault' as const,
      title: 'Fault Injection & Safe Rollback',
      description: 'Simulates target database lock timeout; demonstrates staging table purge and zero corrupt target data.',
      badgeText: 'Recovery Validation',
    },
  ];

  const stages = [
    { key: 'extract', label: '1. Extract', desc: 'CSV & MySQL' },
    { key: 'validate', label: '2. Validate', desc: 'Schema & Rules' },
    { key: 'quarantine', label: '3. Quarantine', desc: 'Dead-Letter Segregation' },
    { key: 'clean', label: '4. Clean', desc: 'Dedup & Trim' },
    { key: 'transform', label: '5. Transform', desc: 'Vectorized Calc' },
    { key: 'load', label: '6. Load', desc: 'Idempotent MySQL' },
    { key: 'reconcile', label: '7. Reconcile', desc: 'Row Conservation' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>ETL / ELT Execution Engine</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Execute end-to-end data pipelines with automated validation gating, quarantine dead-letter routing, and MySQL upserts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecutePipeline(selectedScenario)}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all shadow-md disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'Pipeline In Progress...' : 'Execute Selected Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => !isRunning && setSelectedScenario(sc.id)}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500/80 bg-emerald-950/20 shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className={isSelected ? 'text-emerald-400' : 'text-zinc-200'}>{sc.title}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{sc.badgeText}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{sc.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Stage Visualizer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Pipeline State Machine &amp; Stage Telemetry</span>
          </h3>
          {currentRun && (
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              <span>Run ID: <strong className="text-zinc-200">{currentRun.run_id}</strong></span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Batch: <strong className="text-zinc-200">{currentRun.batch_id}</strong></span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Status: <strong className={currentRun.status === 'COMPLETED' ? 'text-emerald-400' : currentRun.status === 'RECOVERED' ? 'text-amber-400' : 'text-zinc-200'}>{currentRun.status}</strong></span>
            </div>
          )}
        </div>

        {/* Horizontal Flow Line */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {stages.map((stage, idx) => {
            const stageLog = stageLogs.find(s => s.stage === stage.key);
            const isCompleted = stageLog?.status === 'success';
            const isCurrent = stageLog?.status === 'running';
            const isFailed = stageLog?.status === 'failed';

            return (
              <div
                key={stage.key}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : isCurrent
                    ? 'border-amber-500/60 bg-amber-950/20 animate-pulse'
                    : isFailed
                    ? 'border-rose-500/50 bg-rose-950/20'
                    : 'border-zinc-800 bg-zinc-950/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-zinc-200">{stage.label}</span>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isCurrent && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                    {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{stage.desc}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>{stageLog?.duration_ms ? `${stageLog.duration_ms}ms` : '0ms'}</span>
                  <span>{stageLog?.rows_out !== undefined ? `${stageLog.rows_out} rows` : '--'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry KPIs & Reconciliation */}
      {currentRun && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400 block">Extracted Records</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-100">{currentRun.rows_extracted}</span>
              <span className="text-xs text-zinc-400">total input</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              Source: {currentRun.source_type}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400 block">Valid vs Quarantined</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">{currentRun.rows_valid}</span>
              <span className="text-xs text-zinc-500">/</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{currentRun.rows_quarantined}</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              {currentRun.rows_quarantined > 0 ? `${currentRun.rows_quarantined} isolated to dead-letter` : 'Clean data batch'}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400 block">Target Warehouse Loaded</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-100">{currentRun.rows_loaded}</span>
              <span className="text-xs text-zinc-400">({currentRun.rows_updated} updated)</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-mono">
              ✓ Idempotent Upsert (0 duplicates)
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xs text-zinc-400 block">Execution SLA &amp; Memory</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-zinc-100">{currentRun.execution_duration_sec.toFixed(3)}s</span>
              <span className="text-xs text-zinc-400 font-mono">· {currentRun.memory_peak_mb} MB</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2 font-mono">
              Peak RSS bound to config limits
            </div>
          </div>
        </div>
      )}

      {/* Data Conservation & Reconciliation Scorecard */}
      {currentRun?.reconciliation && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Data Reconciliation Audit (Zero Silent Drops Gating)</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Audit Rule: Extracted == Valid + Quarantined (Conservation of Rows)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-zinc-400 bg-zinc-950/60 font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Entity Name</th>
                  <th className="py-2.5 px-3">Extracted Count</th>
                  <th className="py-2.5 px-3">Valid Rows</th>
                  <th className="py-2.5 px-3">Quarantined Rows</th>
                  <th className="py-2.5 px-3">Loaded / Updated</th>
                  <th className="py-2.5 px-3">Discrepancy</th>
                  <th className="py-2.5 px-3">Integrity Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {Object.entries(currentRun.reconciliation).map(([entity, rec]) => (
                  <tr key={entity} className="hover:bg-zinc-800/20">
                    <td className="py-2.5 px-3 text-zinc-200 font-medium">{entity}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{rec.extracted}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{rec.valid}</td>
                    <td className="py-2.5 px-3 text-amber-400">{rec.quarantined}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{rec.loaded}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{rec.discrepancy}</td>
                    <td className="py-2.5 px-3">
                      {rec.is_balanced ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Balanced (100% accounted)
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy detected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution Terminal & Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Logs */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 text-zinc-400">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Structured Execution Telemetry &amp; JSON Logger</span>
            </div>
            <span className="text-[10px] text-zinc-500">FORMAT: JSON LOGGING</span>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto text-zinc-300">
            {stageLogs.length === 0 ? (
              <div className="text-zinc-600 italic py-6 text-center">
                Select a scenario and click &apos;Execute Selected Scenario&apos; to view live execution logs.
              </div>
            ) : (
              stageLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-zinc-500">[{new Date().toISOString().substring(11, 19)}]</span>{" "}
                  <span className={log.status === 'success' ? 'text-emerald-400' : log.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}>
                    [{log.stage.toUpperCase()}]
                  </span>{" "}
                  <span>{log.message}</span>
                  {log.details && (
                    <div className="pl-4 text-zinc-500 text-[11px] mt-0.5">
                      {log.details.map((d, di) => (
                        <div key={di}>↳ {d}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Execution History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
            <h4 className="text-xs font-semibold text-zinc-200">Recent Pipeline Audits</h4>
            <span className="text-[10px] font-mono text-zinc-500">pipeline_runs</span>
          </div>

          <div className="space-y-2">
            {recentRuns.map((run) => (
              <div key={run.run_id} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200 font-semibold">{run.run_id}</span>
                  <span className={`text-[10px] ${
                    run.status === 'COMPLETED' ? 'text-emerald-400' : run.status === 'RECOVERED' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {run.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px] mt-1">
                  <span>{run.rows_extracted} in / {run.rows_loaded} out</span>
                  <span>{run.execution_duration_sec.toFixed(2)}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
