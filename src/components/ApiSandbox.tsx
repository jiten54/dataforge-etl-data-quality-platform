import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Send, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Layers, 
  AlertCircle
} from 'lucide-react';

export const ApiSandbox: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('POST_RUN');
  const [requestParam, setRequestParam] = useState<string>('{"dry_run": false, "batch_name": "retail_batch_manual"}');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number>(202);
  const [responseBody, setResponseBody] = useState<any>({
    run_id: "run_manual_5a9b2c",
    status: "ACCEPTED",
    message: "Pipeline execution scheduled in background.",
    started_at: "2026-10-13T19:30:00Z"
  });
  const [copied, setCopied] = useState<boolean>(false);

  const endpoints = [
    {
      id: 'POST_RUN',
      method: 'POST',
      path: '/api/v1/pipelines/run',
      desc: 'Triggers asynchronous pipeline run with concurrency mutex lock.',
      defaultBody: '{\n  "dry_run": false,\n  "batch_name": "retail_batch_q4"\n}',
      sampleResponse: {
        run_id: "run_auto_7781b0",
        status: "ACCEPTED",
        message: "Pipeline execution scheduled in background.",
        started_at: new Date().toISOString()
      },
      status: 202
    },
    {
      id: 'GET_STATUS',
      method: 'GET',
      path: '/api/v1/pipelines/status/run_9f2a41bc01',
      desc: 'Retrieves execution status, latency, and throughput metrics for a run.',
      defaultBody: '',
      sampleResponse: {
        run_id: "run_9f2a41bc01",
        pipeline_name: "retail_ecomm_elt",
        batch_id: "batch_20261013_180000",
        status: "COMPLETED",
        rows_extracted: 45,
        rows_valid: 36,
        rows_quarantined: 9,
        rows_loaded: 36,
        execution_duration_sec: 1.1842,
        memory_peak_mb: 46.8
      },
      status: 200
    },
    {
      id: 'GET_HISTORY',
      method: 'GET',
      path: '/api/v1/pipelines/history?limit=5',
      desc: 'Lists recent pipeline executions from pipeline_runs table.',
      defaultBody: '',
      sampleResponse: [
        { run_id: "run_9f2a41bc01", status: "COMPLETED", rows_extracted: 45, duration: 1.18 },
        { run_id: "run_8b11c9de44", status: "COMPLETED", rows_extracted: 120, duration: 2.04 },
        { run_id: "run_7a03df1290", status: "RECOVERED", rows_extracted: 50, duration: 0.42 }
      ],
      status: 200
    },
    {
      id: 'GET_DQ',
      method: 'GET',
      path: '/api/v1/data-quality/summary',
      desc: 'Aggregates quarantined records by entity and rejection code.',
      defaultBody: '',
      sampleResponse: {
        summary: [
          { entity_name: "customers", rejection_code: "INVALID_EMAIL", count: 2 },
          { entity_name: "customers", rejection_code: "NULL_PK", count: 1 },
          { entity_name: "products", rejection_code: "NEGATIVE_PRICE", count: 1 },
          { entity_name: "orders", rejection_code: "INVALID_FK_CUSTOMER", count: 1 }
        ]
      },
      status: 200
    },
    {
      id: 'GET_HEALTH',
      method: 'GET',
      path: '/health',
      desc: 'Kubernetes / Docker readiness and liveness health probe.',
      defaultBody: '',
      sampleResponse: {
        status: "healthy",
        service: "dataforge-etl-api",
        version: "1.0.0",
        db_connected: true
      },
      status: 200
    }
  ];

  const currentEp = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const handleSelectEndpoint = (ep: typeof endpoints[0]) => {
    setSelectedEndpoint(ep.id);
    setRequestParam(ep.defaultBody);
    setResponseStatus(ep.status);
    setResponseBody(ep.sampleResponse);
  };

  const handleExecuteApi = () => {
    setIsCalling(true);
    setTimeout(() => {
      setIsCalling(false);
      setResponseStatus(currentEp.status);
      setResponseBody(currentEp.sampleResponse);
    }, 200);
  };

  const copyCurl = () => {
    const curl = currentEp.method === 'POST'
      ? `curl -X POST "http://localhost:8000${currentEp.path}" -H "Content-Type: application/json" -d '${requestParam.replace(/\n/g, '')}'`
      : `curl -X GET "http://localhost:8000${currentEp.path}"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>FastAPI REST Service Sandbox</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Interactive OpenAPI documentation &amp; execution client for triggering asynchronous pipeline batches and monitoring SLAs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Framework: <strong>FastAPI 0.110+</strong></span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>ASGI: <strong>Uvicorn</strong></span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Docs: <strong>/docs (Swagger UI)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint List */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xs font-semibold text-zinc-300 block mb-1">API Endpoints:</span>
          {endpoints.map((ep) => {
            const isSelected = selectedEndpoint === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500/70 bg-emerald-950/20'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="text-zinc-200 font-semibold">{ep.path}</span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1">{ep.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Request & Response Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className={`px-2 py-0.5 rounded font-bold ${
                  currentEp.method === 'POST' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {currentEp.method}
                </span>
                <span className="text-zinc-100 font-bold">{currentEp.path}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyCurl}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy cURL'}</span>
                </button>
                <button
                  onClick={handleExecuteApi}
                  disabled={isCalling}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isCalling ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </div>

            {/* Request Body Editor for POST */}
            {currentEp.method === 'POST' && (
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-zinc-400 block text-[11px]">Request Body (application/json):</span>
                <textarea
                  value={requestParam}
                  onChange={(e) => setRequestParam(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono text-xs"
                />
              </div>
            )}

            {/* Response Viewer */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Response Body</span>
                <div className="flex items-center gap-2">
                  <span>Status: <strong className={responseStatus < 300 ? 'text-emerald-400' : 'text-rose-400'}>{responseStatus} {responseStatus === 202 ? 'ACCEPTED' : 'OK'}</strong></span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Latency: <strong className="text-zinc-200">22 ms</strong></span>
                </div>
              </div>
              <pre className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-zinc-300 overflow-x-auto max-h-60 text-xs">
                {JSON.stringify(responseBody, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
