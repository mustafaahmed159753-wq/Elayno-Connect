import React, { useState } from "react";
import {
  Folder,
  Archive,
  Database,
  Disc,
  Code,
  Package,
  FileText,
  Video,
  Hospital,
  PenTool,
  Download,
  Eye,
  CheckCircle2,
  HardDrive,
  Files,
  ChevronRight,
} from "lucide-react";
import { Message } from "../types";
import { identifyFolderType, FolderTypeInfo } from "../utils/folderType";

interface FolderCardProps {
  message: Message;
  isMine: boolean;
  onBrowseManifest?: (folderName: string, typeInfo: FolderTypeInfo, manifest: { name: string; size: number; path?: string }[], downloadUrl: string) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ message, isMine, onBrowseManifest }) => {
  const folderName = message.filename || "Shared_Folder";
  const manifest = message.folder_manifest || [];
  const typeInfo = identifyFolderType(folderName, manifest);

  const getCategoryIcon = () => {
    switch (typeInfo.category) {
      case "medical":
        return <Hospital className="w-7 h-7 text-teal-400" />;
      case "archive":
        return <Archive className="w-7 h-7 text-amber-400" />;
      case "backup":
        return <Database className="w-7 h-7 text-emerald-400" />;
      case "disk":
        return <Disc className="w-7 h-7 text-purple-400" />;
      case "code":
        return <Code className="w-7 h-7 text-cyan-400" />;
      case "bundle":
        return <Package className="w-7 h-7 text-sky-400" />;
      case "cad":
        return <PenTool className="w-7 h-7 text-pink-400" />;
      case "docs":
        return <FileText className="w-7 h-7 text-blue-400" />;
      case "media":
        return <Video className="w-7 h-7 text-red-400" />;
      default:
        return <Folder className="w-7 h-7 text-indigo-400" />;
    }
  };

  const downloadUrl = message.download_url || message.data || `/shared/${message.filename}`;
  const fileCount = message.file_count || (manifest.length > 0 ? manifest.length : 1);
  const sizeLabel = message.file_size_str || "Directory Archive";

  return (
    <div className="w-full min-w-[260px] sm:min-w-[340px] max-w-[440px] p-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-xl text-slate-100 flex flex-col gap-3">
      {/* Top Header: Badge and Category */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${typeInfo.badgeColor} shadow-xs flex items-center gap-1`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {message.folder_badge || typeInfo.badge}
          </span>
          {message.folder_extension && (
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {message.folder_extension}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <HardDrive className="w-3 h-3 text-cyan-400" />
          <span>{sizeLabel}</span>
        </div>
      </div>

      {/* Main Folder Details */}
      <div className="flex items-start gap-3">
        {/* Large Folder Icon Pod */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner relative group">
          {getCategoryIcon()}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-mono font-bold text-cyan-300">
            {fileCount > 99 ? "99+" : fileCount}
          </span>
        </div>

        {/* Name and Description */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xs sm:text-sm text-white truncate block" title={folderName}>
            {folderName}
          </h4>
          <p className="text-[11px] text-cyan-300 font-medium truncate block mt-0.5">
            {message.folder_type || typeInfo.typeName}
          </p>
          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
            {typeInfo.description}
          </p>
        </div>
      </div>

      {/* Folder Metadata Bar */}
      <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Files className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {fileCount} {fileCount === 1 ? "bundled file" : "bundled files"}
          </span>
        </span>
        <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Ready to Stream
        </span>
      </div>

      {/* Actions: Browse & Download */}
      <div className="flex items-center gap-2 pt-1">
        {manifest.length > 0 && onBrowseManifest && (
          <button
            type="button"
            onClick={() => onBrowseManifest(folderName, typeInfo, manifest, downloadUrl)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-650 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" /> Browse Files
          </button>
        )}

        <a
          href={`/api/download/${downloadUrl.split("/").pop()}`}
          download={folderName}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 hover:from-teal-400 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-cyan-900/30 cursor-pointer text-center"
        >
          <Download className="w-3.5 h-3.5 text-white" /> Download Folder
        </a>
      </div>

      {/* Optional Caption */}
      {message.msg && (
        <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 break-words">
          {message.msg}
        </div>
      )}
    </div>
  );
};
