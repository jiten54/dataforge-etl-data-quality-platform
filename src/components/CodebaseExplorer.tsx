import React, { useState } from 'react';
import { 
  Code2, 
  FileCode, 
  Copy, 
  Check, 
  Folder, 
  FolderOpen, 
  Download, 
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';
import { REPO_FILES, RepoFile } from '../data/mockRepositoryFiles';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/pipeline.py');
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = REPO_FILES.find(f => f.path === selectedFilePath) || REPO_FILES[1];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { id: 'core', label: 'Orchestrator & Config' },
    { id: 'extract', label: 'Extraction & Watermarks' },
    { id: 'validation', label: 'Validation & Quarantine' },
    { id: 'transform', label: 'Transforms & Rules' },
    { id: 'load', label: 'Idempotent Loading' },
    { id: 'api', label: 'FastAPI Service' },
    { id: 'sql', label: 'MySQL DDL & Queries' },
    { id: 'tests', label: 'Pytest Test Suites' },
    { id: 'infra', label: 'Docker & CI/CD' },
  ];

  const lines = currentFile.content.split('\n');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span>Production Source Codebase &amp; Architecture Browser</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspect all modular components designed for Athena Tech: Extraction, Normalization, Business Rules, Idempotency, and Pytest.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span>Structure: <strong>dataforge-etl-platform/</strong></span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Total Files: <strong>{REPO_FILES.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Explorer Grid: File Tree vs File Code View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: File Tree */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
          <span className="text-xs font-semibold text-zinc-300 block mb-2">Repository Files:</span>

          <div className="space-y-3">
            {categories.map((cat) => {
              const filesInCat = REPO_FILES.filter(f => f.category === cat.id);
              if (filesInCat.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                    <Folder className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{cat.label}</span>
                  </div>
                  <div className="space-y-0.5 pl-2 border-l border-zinc-800 ml-2">
                    {filesInCat.map((f) => {
                      const isSelected = selectedFilePath === f.path;
                      return (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-950/30 text-emerald-400 font-semibold border border-emerald-500/30'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                          }`}
                        >
                          <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          <span className="truncate">{f.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          {/* File Top Bar */}
          <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
              <span className="text-zinc-500">path:</span>
              <span className="font-semibold text-emerald-400">{currentFile.path}</span>
              <span aria-hidden="true" className="text-zinc-700">·</span>
              <span className="text-zinc-500">{lines.length} lines</span>
              <span aria-hidden="true" className="text-zinc-700">·</span>
              <span className="text-zinc-500">{currentFile.language}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Window with Line Numbers */}
          <div className="bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[600px] leading-relaxed flex">
            <div className="select-none text-zinc-600 text-right pr-4 border-r border-zinc-800/80 mr-4 font-mono text-xs space-y-0.5">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="overflow-x-auto text-zinc-200 whitespace-pre">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
