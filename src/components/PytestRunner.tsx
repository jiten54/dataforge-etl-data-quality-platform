import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Play, 
  Terminal, 
  FileCheck, 
  Cpu, 
  GitBranch, 
  ShieldCheck,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PYTEST_CASES } from '../data/sampleData';
import { PytestCase } from '../types/dataforge';

export const PytestRunner: React.FC = () => {
  const [testCases, setTestCases] = useState<PytestCase[]>(PYTEST_CASES);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'coverage' | 'ci'>('tests');

  const handleRunAllTests = () => {
    setIsRunning(true);
    let idx = 0;

    // Reset status
    setTestCases(prev => prev.map(t => ({ ...t, status: 'running' })));

    const interval = setInterval(() => {
      setActiveTestIndex(idx);
      setTestCases(prev => prev.map((t, i) => i <= idx ? { ...t, status: 'passed' } : t));
      idx++;

      if (idx >= testCases.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsRunning(false);
          setActiveTestIndex(null);
        }, 300);
      }
    }, 120);
  };

  const coverageData = [
    { module: "src/config.py", statements: 24, missing: 0, coverage: "100%" },
    { module: "src/extract/csv_extractor.py", statements: 22, missing: 1, coverage: "95%" },
    { module: "src/extract/watermark.py", statements: 26, missing: 2, coverage: "92%" },
    { module: "src/validation/schema_validator.py", statements: 16, missing: 0, coverage: "100%" },
    { module: "src/validation/quality_rules.py", statements: 26, missing: 0, coverage: "100%" },
    { module: "src/validation/quarantine.py", statements: 24, missing: 0, coverage: "100%" },
    { module: "src/transform/cleaner.py", statements: 18, missing: 0, coverage: "100%" },
    { module: "src/transform/normalizer.py", statements: 22, missing: 1, coverage: "95%" },
    { module: "src/transform/business_rules.py", statements: 28, missing: 0, coverage: "100%" },
    { module: "src/load/idempotent_upsert.py", statements: 22, missing: 1, coverage: "95%" },
    { module: "src/monitoring/reconciliation.py", statements: 15, missing: 0, coverage: "100%" },
  ];

  const totalPassed = testCases.filter(t => t.status === 'passed').length;
  const totalDuration = testCases.reduce((acc, t) => acc + t.duration_ms, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Automated Testing Suite (Pytest 8.1+)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comprehensive unit and integration testing verifying data cleaning, schema validation, transaction rollbacks, and idempotency.
            </p>
          </div>
          <button
            onClick={handleRunAllTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running Pytest...' : 'Execute pytest tests/'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-zinc-500 block text-[11px]">Test Suite Status</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle className="w-5 h-5" />
            <span>{totalPassed} / {testCases.length} PASSED</span>
          </div>
          <span className="text-zinc-500 text-[10px] block mt-1">100% test pass rate</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-zinc-500 block text-[11px]">Cumulative Assertions</span>
          <div className="text-2xl font-bold text-zinc-100 mt-1">
            {testCases.reduce((acc, t) => acc + t.assertCount, 0)}
          </div>
          <span className="text-zinc-500 text-[10px] block mt-1">Granular invariant assertions</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-zinc-500 block text-[11px]">Execution Latency</span>
          <div className="text-2xl font-bold text-zinc-100 mt-1">
            {(totalDuration / 1000).toFixed(2)}s
          </div>
          <span className="text-zinc-500 text-[10px] block mt-1">Parallelized via pytest-xdist</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <span className="text-zinc-500 block text-[11px]">Code Coverage</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            97.4%
          </div>
          <span className="text-zinc-500 text-[10px] block mt-1">Total statement coverage</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-zinc-800 text-xs">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'tests'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Test Cases ({testCases.length})
        </button>
        <button
          onClick={() => setActiveTab('coverage')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'coverage'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Coverage Matrix
        </button>
        <button
          onClick={() => setActiveTab('ci')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'ci'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          GitHub Actions CI/CD
        </button>
      </div>

      {/* Tab 1: Test Cases */}
      {activeTab === 'tests' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-zinc-400 bg-zinc-950/70 font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Test Name</th>
                  <th className="py-2.5 px-3">Suite</th>
                  <th className="py-2.5 px-3">Test File</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Assertions</th>
                  <th className="py-2.5 px-3">Verification Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {testCases.map((tc, idx) => (
                  <tr
                    key={tc.id}
                    className={`hover:bg-zinc-800/30 transition-colors ${
                      activeTestIndex === idx ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      {tc.status === 'passed' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> RUNNING
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-200 font-semibold">{tc.name}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{tc.suite.toUpperCase()}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{tc.file}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{tc.duration_ms} ms</td>
                    <td className="py-2.5 px-3 text-zinc-300">{tc.assertCount}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-sans">{tc.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Coverage Table */}
      {activeTab === 'coverage' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-3 bg-zinc-950/50 border-b border-zinc-800 text-xs font-mono text-zinc-400 flex justify-between">
            <span>pytest-cov Statement Coverage Analysis</span>
            <span className="text-emerald-400 font-bold">TOTAL COVERAGE: 97.4%</span>
          </div>
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-zinc-400 bg-zinc-950/70 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Python Module</th>
                <th className="py-2.5 px-4">Statements</th>
                <th className="py-2.5 px-4">Missed</th>
                <th className="py-2.5 px-4">Coverage</th>
                <th className="py-2.5 px-4">Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {coverageData.map((row) => (
                <tr key={row.module} className="hover:bg-zinc-800/20">
                  <td className="py-2.5 px-4 text-zinc-200">{row.module}</td>
                  <td className="py-2.5 px-4 text-zinc-400">{row.statements}</td>
                  <td className="py-2.5 px-4 text-zinc-400">{row.missing}</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-400">{row.coverage}</td>
                  <td className="py-2.5 px-4 text-emerald-400">✓ Production Grade</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: CI/CD Workflow */}
      {activeTab === 'ci' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2 text-zinc-200 font-semibold">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              .github/workflows/ci.yml
            </span>
            <span className="text-emerald-400">GitHub Actions Matrix: Python 3.12 + MySQL 8.0</span>
          </div>

          <pre className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-96">
            <code>{`name: DataForge CI/CD Pipeline
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: dataforge_test_dw
          MYSQL_USER: dataforge_user
          MYSQL_PASSWORD: dataforge_secure_pass_2026
        ports: ["3306:3306"]
        options: --health-cmd="mysqladmin ping" --health-interval=10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12", cache: "pip" }
      - run: pip install -r requirements.txt
      - run: flake8 src tests
      - run: mypy src
      - run: mysql -h 127.0.0.1 -u dataforge_user -pdataforge_secure_pass_2026 dataforge_test_dw < sql/schema.sql
      - run: pytest tests/ -v --cov=src --cov-report=xml`}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
