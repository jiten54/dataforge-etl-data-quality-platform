import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Gauge, 
  CheckCircle2, 
  Code2, 
  FileCode, 
  Briefcase,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import JSZip from 'jszip';
import { REPO_FILES } from '../data/mockRepositoryFiles';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAlignmentModal: () => void;
  isRunningPipeline: boolean;
  onTriggerQuickRun: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAlignmentModal,
  isRunningPipeline,
  onTriggerQuickRun,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("dataforge-etl-platform");

      REPO_FILES.forEach(file => {
        folder?.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dataforge-etl-platform.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP creation failed", err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const navItems = [
    { id: 'workbench', label: 'Pipeline Workbench', icon: Play },
    { id: 'quarantine', label: 'Quality & Quarantine', icon: ShieldCheck },
    { id: 'sql', label: 'SQL & Warehousing', icon: Database },
    { id: 'benchmarks', label: 'Performance Lab', icon: Gauge },
    { id: 'pytest', label: 'Pytest Suite', icon: CheckCircle2 },
    { id: 'api', label: 'FastAPI Sandbox', icon: Terminal },
    { id: 'codebase', label: 'Codebase Browser', icon: Code2 },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-zinc-100 sticky top-0 z-40 backdrop-blur">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-lg shadow-sm">
            DF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-base">DataForge</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 text-xs sm:text-sm">Automated ETL & Data Quality Platform</span>
            </div>
            {/* Zero-Pill Typography per Constitution */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
              <span>Python 3.12</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Pandas &amp; NumPy</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>MySQL 8.0</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Idempotent Upsert</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Pytest</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAlignmentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
            title="Inspect mapping to Athena Tech Data Engineer job specification"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Athena Tech Alignment</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Download complete ready-to-run Python repository as ZIP"
          >
            {isExportingZip ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>Download .ZIP</span>
          </button>

          <button
            onClick={onTriggerQuickRun}
            disabled={isRunningPipeline}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all shadow-sm disabled:opacity-50"
          >
            {isRunningPipeline ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Batch ETL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Segmented Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 py-2 px-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
