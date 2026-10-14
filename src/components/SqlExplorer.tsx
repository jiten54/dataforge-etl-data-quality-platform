import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Terminal, 
  FileText, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Code2,
  Table as TableIcon
} from 'lucide-react';
import { SQL_REPORTING_QUERIES } from '../data/sampleData';
import { SqlReportQuery } from '../types/dataforge';

export const SqlExplorer: React.FC = () => {
  const [selectedReportId, setSelectedReportId] = useState<string>('report_1');
  const [showExplainPlan, setShowExplainPlan] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryExecutionMs, setQueryExecutionMs] = useState<number>(14.2);

  const currentReport = SQL_REPORTING_QUERIES.find(q => q.id === selectedReportId) || SQL_REPORTING_QUERIES[0];

  const handleRunQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setQueryExecutionMs(Number((Math.random() * 8 + 8).toFixed(1)));
    }, 250);
  };

  const schemaTables = [
    {
      name: 'dim_customers',
      type: 'Dimension Table',
      pk: 'customer_sk, customer_id (UQ)',
      columns: [
        { name: 'customer_sk', type: 'BIGINT AUTO_INCREMENT', key: 'PK' },
        { name: 'customer_id', type: 'INT', key: 'UQ' },
        { name: 'full_name', type: 'VARCHAR(205)', key: 'GENERATED' },
        { name: 'email', type: 'VARCHAR(255)', key: '' },
        { name: 'customer_tier', type: 'ENUM(...)', key: 'IDX' },
        { name: 'last_batch_id', type: 'VARCHAR(64)', key: '' },
      ]
    },
    {
      name: 'dim_products',
      type: 'Dimension Table',
      pk: 'product_sk, product_id (UQ)',
      columns: [
        { name: 'product_id', type: 'INT', key: 'UQ' },
        { name: 'sku', type: 'VARCHAR(64)', key: 'UQ' },
        { name: 'product_name', type: 'VARCHAR(255)', key: '' },
        { name: 'unit_price', type: 'DECIMAL(12,2)', key: '' },
        { name: 'cost_price', type: 'DECIMAL(12,2)', key: '' },
        { name: 'margin_percent', type: 'DECIMAL(5,2)', key: 'GENERATED' },
      ]
    },
    {
      name: 'fct_orders',
      type: 'Fact Table',
      pk: 'order_id (PK)',
      columns: [
        { name: 'order_id', type: 'INT', key: 'PK' },
        { name: 'customer_id', type: 'INT', key: 'FK -> dim_customers' },
        { name: 'order_date', type: 'DATETIME', key: 'IDX' },
        { name: 'order_status', type: 'ENUM(...)', key: 'IDX' },
        { name: 'total_amount', type: 'DECIMAL(12,2)', key: '' },
        { name: 'last_batch_id', type: 'VARCHAR(64)', key: '' },
      ]
    },
    {
      name: 'fct_order_items',
      type: 'Fact Table',
      pk: 'order_item_id (PK)',
      columns: [
        { name: 'order_item_id', type: 'INT', key: 'PK' },
        { name: 'order_id', type: 'INT', key: 'FK -> fct_orders' },
        { name: 'product_id', type: 'INT', key: 'FK -> dim_products' },
        { name: 'quantity', type: 'INT', key: '' },
        { name: 'line_total', type: 'DECIMAL(12,2)', key: '' },
        { name: 'gross_margin', type: 'DECIMAL(12,2)', key: '' },
      ]
    },
    {
      name: 'quarantined_records',
      type: 'Dead-Letter Table',
      pk: 'quarantine_id (PK)',
      columns: [
        { name: 'quarantine_id', type: 'BIGINT AUTO_INCREMENT', key: 'PK' },
        { name: 'run_id', type: 'VARCHAR(64)', key: 'FK -> pipeline_runs' },
        { name: 'entity_name', type: 'VARCHAR(64)', key: 'IDX' },
        { name: 'rejection_code', type: 'VARCHAR(64)', key: 'IDX' },
        { name: 'raw_payload', type: 'JSON', key: '' },
      ]
    },
    {
      name: 'pipeline_runs',
      type: 'Audit / Metadata Table',
      pk: 'run_id (PK)',
      columns: [
        { name: 'run_id', type: 'VARCHAR(64)', key: 'PK' },
        { name: 'batch_id', type: 'VARCHAR(64)', key: '' },
        { name: 'status', type: 'ENUM(...)', key: 'IDX' },
        { name: 'rows_extracted', type: 'INT', key: '' },
        { name: 'execution_duration_sec', type: 'DECIMAL(10,4)', key: '' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>MySQL 8.0 Data Warehouse &amp; Analytical SQL Studio</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-tier Medallion architecture (Raw Dead-letter, Staging buffer, Dimensional Star Schema) with parameterized analytical reports.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Engine: <strong>InnoDB</strong></span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Charset: <strong>utf8mb4</strong></span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Isolation: <strong>READ COMMITTED</strong></span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Schema Navigator vs Query Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Schema Navigator */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-400" />
              <span>Data Warehouse Tables</span>
            </h3>

            <div className="space-y-2">
              {schemaTables.map((tbl) => (
                <div key={tbl.name} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-semibold text-zinc-200">{tbl.name}</span>
                    <span className="text-[10px] text-zinc-500">{tbl.type}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-zinc-400">
                    {tbl.columns.slice(0, 3).map((col, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{col.name}</span>
                        <span className="text-zinc-600">{col.key || col.type.split(' ')[0]}</span>
                      </div>
                    ))}
                    {tbl.columns.length > 3 && (
                      <span className="text-[10px] text-zinc-500 block pt-0.5">
                        + {tbl.columns.length - 3} more columns
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Query Runner & Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Query Selector Tabs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Select Production SQL Query:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExplainPlan(!showExplainPlan)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    showExplainPlan
                      ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  EXPLAIN Plan
                </button>
                <button
                  onClick={handleRunQuery}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SQL_REPORTING_QUERIES.map((q) => {
                const isSelected = selectedReportId === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedReportId(q.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300'
                        : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-medium">{q.title}</div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{q.description}</div>
                  </button>
                );
              })}
            </div>

            {/* SQL Code Box */}
            <div className="relative">
              <pre className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-48">
                <code>{currentReport.sql}</code>
              </pre>
            </div>

            {/* EXPLAIN Plan Box */}
            {showExplainPlan && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-amber-500/30 font-mono text-xs text-amber-300/90 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">MySQL 8.0 Query Execution Plan (EXPLAIN FORMAT=TREE):</div>
                <pre className="overflow-x-auto whitespace-pre">{currentReport.explainPlan}</pre>
              </div>
            )}
          </div>

          {/* Query Results Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Result Set: <strong className="text-zinc-200">{currentReport.rows.length} rows</strong></span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>Latency: <strong className="text-emerald-400">{queryExecutionMs} ms</strong></span>
              </div>
              <span className="text-[10px] text-zinc-500">FORMAT: TABULAR</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-zinc-400 bg-zinc-950/40 font-mono border-b border-zinc-800">
                  <tr>
                    {currentReport.columns.map((col) => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {currentReport.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                      {currentReport.columns.map((col) => {
                        const val = row[col];
                        return (
                          <td key={col} className="py-2 px-3 text-zinc-300 whitespace-nowrap">
                            {typeof val === 'number' && col.includes('pct') 
                              ? `${val}%` 
                              : typeof val === 'number' && (col.includes('revenue') || col.includes('spent') || col.includes('profit') || col.includes('amount') || col.includes('value'))
                              ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
