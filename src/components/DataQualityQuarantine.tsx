import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Code, 
  Filter,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { QuarantinedRecord } from '../types/dataforge';

interface DataQualityQuarantineProps {
  quarantineRecords: QuarantinedRecord[];
  onToggleResolve: (id: number) => void;
  onClearResolved: () => void;
}

export const DataQualityQuarantine: React.FC<DataQualityQuarantineProps> = ({
  quarantineRecords,
  onToggleResolve,
  onClearResolved,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedCode, setSelectedCode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedRecord, setInspectedRecord] = useState<QuarantinedRecord | null>(null);

  // Entities & Rejection Codes
  const entityOptions = ['all', 'customers', 'products', 'orders', 'order_items'];
  const codeOptions = [
    'all',
    'INVALID_EMAIL',
    'NULL_PK',
    'NEGATIVE_PRICE',
    'MISSING_SKU',
    'INVALID_FK_CUSTOMER',
    'INVALID_STATUS',
    'INVALID_DATE',
    'INVALID_FK_ORDER',
    'INVALID_FK_PRODUCT',
    'INVALID_QUANTITY',
  ];

  const filteredRecords = quarantineRecords.filter(r => {
    if (selectedEntity !== 'all' && r.entity_name !== selectedEntity) return false;
    if (selectedCode !== 'all' && r.rejection_code !== selectedCode) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKey = r.natural_key.toLowerCase().includes(q);
      const matchReason = r.rejection_reason.toLowerCase().includes(q);
      const matchPayload = JSON.stringify(r.raw_payload).toLowerCase().includes(q);
      if (!matchKey && !matchReason && !matchPayload) return false;
    }
    return true;
  });

  const exportAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dataforge_quarantine_report_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAsCsv = () => {
    const headers = ["quarantine_id", "run_id", "entity_name", "natural_key", "rejection_code", "rejection_reason", "quarantined_at", "resolved"];
    const rows = filteredRecords.map(r => [
      r.quarantine_id,
      r.run_id,
      r.entity_name,
      `"${r.natural_key}"`,
      r.rejection_code,
      `"${r.rejection_reason.replace(/"/g, '""')}"`,
      r.quarantined_at,
      r.resolved
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `dataforge_quarantine_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Total Quarantined Records</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400">{quarantineRecords.length}</span>
            <span className="text-xs text-zinc-400">isolated rows</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Zero corrupted data passed to warehouse
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Unique Rejection Codes</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {new Set(quarantineRecords.map(r => r.rejection_code)).size}
            </span>
            <span className="text-xs text-zinc-400">rules triggered</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            PK nulls, regex emails, FK checks, price bounds
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Resolved / Taged</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {quarantineRecords.filter(r => r.resolved).length}
            </span>
            <span className="text-xs text-zinc-400">of {quarantineRecords.length} records</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Remediated via manual inspection or replay
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-400 block">Storage Engine</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-bold font-mono text-zinc-100">quarantined_records</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            MySQL 8.0 JSON Payload Column
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400">Entity:</span>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                {entityOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-zinc-900 text-zinc-200">
                    {opt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Rejection Code Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-zinc-400">Rejection Code:</span>
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                {codeOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-zinc-900 text-zinc-200">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box and Export Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search key or payload..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={exportAsJson}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Export Quarantine as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={exportAsCsv}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Export Quarantine as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quarantined Records Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-zinc-400 bg-zinc-950/70 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Natural Key</th>
                <th className="py-2.5 px-3">Rejection Code</th>
                <th className="py-2.5 px-3">Failure Explanation &amp; Diagnostic</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500 italic">
                    No quarantined records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.quarantine_id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-zinc-400">{r.quarantine_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-zinc-200">{r.entity_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 font-bold">{r.natural_key}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-amber-400 font-semibold">{r.rejection_code}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 font-sans max-w-md truncate" title={r.rejection_reason}>
                      {r.rejection_reason}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 text-[11px] whitespace-nowrap">
                      {r.quarantined_at.replace("T", " ").substring(0, 19)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setInspectedRecord(r)}
                          className="px-2 py-1 text-[11px] rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                          title="Inspect raw payload JSON"
                        >
                          <Code className="w-3 h-3 text-zinc-400" />
                          <span>Payload</span>
                        </button>
                        <button
                          onClick={() => onToggleResolve(r.quarantine_id)}
                          className={`px-2 py-1 text-[11px] rounded transition-colors ${
                            r.resolved
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="Toggle resolved state"
                        >
                          {r.resolved ? 'Resolved' : 'Mark Resolved'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Payload Inspector Modal */}
      {inspectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Quarantined Payload: {inspectedRecord.entity_name} (Key: {inspectedRecord.natural_key})</span>
                </h3>
                <span className="text-xs text-amber-400 font-mono mt-0.5 block">
                  [{inspectedRecord.rejection_code}] {inspectedRecord.rejection_reason}
                </span>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-zinc-400 font-mono block">Raw Ingested Record (JSON):</span>
              <pre className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-60">
                {JSON.stringify(inspectedRecord.raw_payload, null, 2)}
              </pre>
            </div>

            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 text-xs text-zinc-400">
              <strong className="text-zinc-200">Engineer Remediation Advice:</strong>
              <p className="mt-1">
                {inspectedRecord.rejection_code === 'INVALID_EMAIL' && "Correct email syntax at source feeder or request clean customer signup record."}
                {inspectedRecord.rejection_code === 'NULL_PK' && "Source extraction query must enforce NOT NULL on primary key column before batch emission."}
                {inspectedRecord.rejection_code === 'NEGATIVE_PRICE' && "Trigger upstream pricing catalog audit: product unit_price cannot be non-positive."}
                {inspectedRecord.rejection_code.startsWith('INVALID_FK') && "Verify parent entity batch order: ensure dimension tables are loaded prior to fact tables."}
                {inspectedRecord.rejection_code === 'INVALID_DATE' && "Check timestamp serialization and time zone offsets to prevent future or corrupt dates."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onToggleResolve(inspectedRecord.quarantine_id);
                  setInspectedRecord(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors"
              >
                Mark Remediated &amp; Close
              </button>
              <button
                onClick={() => setInspectedRecord(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
