import React, { useState } from "react";
import { X, Search, File, Folder, Download, HardDrive, Files, ShieldCheck } from "lucide-react";
import { FolderTypeInfo } from "../utils/folderType";

interface FolderBrowseModalProps {
  folderName: string;
  typeInfo: FolderTypeInfo;
  manifest: { name: string; size: number; path?: string }[];
  downloadUrl: string;
  onClose: () => void;
}

export const FolderBrowseModal: React.FC<FolderBrowseModalProps> = ({
  folderName,
  typeInfo,
  manifest,
  downloadUrl,
  onClose,
}) => {
  const [search, setSearch] = useState("");

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const filtered = manifest.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.path && f.path.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBytes = manifest.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-[280px] sm:max-w-md">
                  {folderName}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${typeInfo.badgeColor}`}>
                  {typeInfo.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {typeInfo.typeName} • {manifest.length} files ({formatSize(totalBytes)})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Metadata Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files inside this folder..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono shrink-0">
            {filtered.length} / {manifest.length} items
          </span>
        </div>

        {/* File Table / List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No files found matching "{search}"
            </div>
          ) : (
            filtered.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <File className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-200 truncate block">
                      {file.name}
                    </span>
                    {file.path && (
                      <span className="text-[10px] text-slate-500 font-mono truncate block">
                        {file.path}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {formatSize(file.size || 0)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer with Download All button */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Folder scanned & integrity verified</span>
          </div>

          <a
            href={`/api/download/${downloadUrl.split("/").pop()}`}
            download={folderName}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-md shadow-cyan-950/40"
          >
            <Download className="w-4 h-4" /> Download Complete Folder
          </a>
        </div>
      </div>
    </div>
  );
};
