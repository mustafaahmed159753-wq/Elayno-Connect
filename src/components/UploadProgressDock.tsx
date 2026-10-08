import React from "react";
import { Folder, HardDrive, Zap, X, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { UploadProgress } from "../utils/chunkedUploader";

interface UploadProgressDockProps {
  progress: UploadProgress;
  onCancel: () => void;
}

export const UploadProgressDock: React.FC<UploadProgressDockProps> = ({ progress, onCancel }) => {
  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Calculating...";
    if (seconds < 60) return `${seconds}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s remaining`;
  };

  return (
    <div className="mx-2 sm:mx-4 mb-2 p-3 rounded-2xl bg-slate-900/98 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-slate-100 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
      {/* Header with Title and Cancel */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white truncate block max-w-[200px] sm:max-w-xs">
                {progress.filename}
              </span>
              {progress.folderTypeInfo && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border ${progress.folderTypeInfo.badgeColor}`}>
                  {progress.folderTypeInfo.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {progress.status === "initializing" && "Preparing folder stream..."}
              {progress.status === "uploading" && "Streaming folder chunks to server..."}
              {progress.status === "finalizing" && "Finalizing package & broadcasting..."}
              {progress.status === "completed" && "Upload complete!"}
              {progress.status === "error" && (progress.errorMessage || "Transfer failed")}
            </span>
          </div>
        </div>

        {progress.status !== "completed" && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Cancel upload"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-200 ease-out shadow-sm ${
            progress.status === "error"
              ? "bg-rose-500"
              : "bg-gradient-to-r from-teal-500 via-cyan-400 to-sky-400 shadow-cyan-500/50"
          }`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>
            {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}
          </span>
          {progress.speedMBs > 0 && progress.status === "uploading" && (
            <span className="flex items-center gap-1 text-cyan-300 font-semibold">
              <Zap className="w-3 h-3" /> {progress.speedMBs} MB/s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {progress.timeRemainingSec > 0 && progress.status === "uploading" && (
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(progress.timeRemainingSec)}
            </span>
          )}
          <span className="text-white font-bold">{progress.percentage}%</span>
        </div>
      </div>
    </div>
  );
};
