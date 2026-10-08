import { identifyFolderType, getFolderExtension, FolderTypeInfo } from "./folderType";
import { Message } from "../types";

export interface UploadProgress {
  uploadId: string;
  filename: string;
  isFolder: boolean;
  folderTypeInfo?: FolderTypeInfo;
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  speedMBs: number;
  timeRemainingSec: number;
  status: "initializing" | "uploading" | "finalizing" | "completed" | "error" | "cancelled";
  errorMessage?: string;
}

export interface ChunkedUploadOptions {
  file: File | Blob;
  filename: string;
  sender: string;
  recipient: string;
  caption?: string;
  isFolder?: boolean;
  folderName?: string;
  fileCount?: number;
  manifest?: { name: string; size: number; path?: string }[];
  chunkSize?: number; // default 8MB
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export async function uploadLargeFileOrFolder(options: ChunkedUploadOptions): Promise<Message> {
  const {
    file,
    filename,
    sender,
    recipient,
    caption = "",
    isFolder = false,
    folderName = filename,
    fileCount = 1,
    manifest = [],
    chunkSize = 8 * 1024 * 1024, // 8MB chunks for optimal throughput and low memory footprint
    onProgress,
    signal,
  } = options;

  const totalSize = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalSize / chunkSize));
  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const folderTypeInfo = isFolder ? identifyFolderType(folderName, manifest) : undefined;
  const folderExtension = isFolder ? getFolderExtension(folderName) : undefined;

  let uploadedBytes = 0;
  let startTime = Date.now();
  let lastTime = startTime;
  let lastUploadedBytes = 0;

  const updateProgress = (
    status: UploadProgress["status"],
    extra: Partial<UploadProgress> = {}
  ) => {
    if (!onProgress) return;
    const now = Date.now();
    const timeDiffSec = Math.max(0.1, (now - lastTime) / 1000);
    const bytesDiff = uploadedBytes - lastUploadedBytes;
    const currentSpeedMBs = Number((bytesDiff / (1024 * 1024 * timeDiffSec)).toFixed(2));

    const remainingBytes = Math.max(0, totalSize - uploadedBytes);
    const avgSpeed = uploadedBytes / Math.max(0.1, (now - startTime) / 1000);
    const timeRemainingSec = avgSpeed > 0 ? Math.round(remainingBytes / avgSpeed) : 0;

    lastTime = now;
    lastUploadedBytes = uploadedBytes;

    onProgress({
      uploadId,
      filename,
      isFolder,
      folderTypeInfo,
      totalBytes: totalSize,
      uploadedBytes,
      percentage: totalSize > 0 ? Math.min(100, Math.round((uploadedBytes / totalSize) * 100)) : 100,
      speedMBs: currentSpeedMBs > 0 ? currentSpeedMBs : Number((avgSpeed / (1024 * 1024)).toFixed(2)),
      timeRemainingSec,
      status,
      ...extra,
    });
  };

  updateProgress("initializing");

  // Step 1: Initialize session on server
  const initRes = await fetch("/api/upload/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId,
      filename,
      totalSize,
      totalChunks,
      isFolder,
      folderType: folderTypeInfo?.typeName,
      fileCount,
      sender,
      recipient,
    }),
    signal,
  });

  if (!initRes.ok) {
    const errData = await initRes.json().catch(() => ({}));
    const msg = errData.m || "Failed to initialize upload session on server";
    updateProgress("error", { errorMessage: msg });
    throw new Error(msg);
  }

  const { safeName } = await initRes.json();

  // Step 2: Upload chunks sequentially
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (signal?.aborted) {
      // Cancel on server
      fetch("/api/upload/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      }).catch(() => {});
      updateProgress("cancelled");
      throw new Error("Upload cancelled by user");
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(totalSize, start + chunkSize);
    const chunkBlob = file.slice(start, end);

    const chunkRes = await fetch("/api/upload/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-upload-id": uploadId,
        "x-chunk-index": String(chunkIndex),
        "x-total-chunks": String(totalChunks),
      },
      body: chunkBlob,
      signal,
    });

    if (!chunkRes.ok) {
      const errData = await chunkRes.json().catch(() => ({}));
      const msg = errData.m || `Failed uploading chunk ${chunkIndex + 1}/${totalChunks}`;
      updateProgress("error", { errorMessage: msg });
      throw new Error(msg);
    }

    uploadedBytes += chunkBlob.size;
    updateProgress("uploading");
  }

  // Step 3: Finalize upload
  updateProgress("finalizing");

  const completeRes = await fetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId,
      safeName,
      filename,
      sender,
      recipient,
      caption,
      isFolder,
      folderType: folderTypeInfo?.typeName,
      folderBadge: folderTypeInfo?.badge,
      folderExtension,
      fileCount,
      manifest,
      totalSize,
    }),
    signal,
  });

  if (!completeRes.ok) {
    const errData = await completeRes.json().catch(() => ({}));
    const msg = errData.m || "Failed to finalize upload on server";
    updateProgress("error", { errorMessage: msg });
    throw new Error(msg);
  }

  const completeData = await completeRes.json();
  updateProgress("completed", { percentage: 100, uploadedBytes: totalSize });

  return completeData.message;
}

export interface DirectoryUploadOptions {
  files: File[] | FileList;
  folderName: string;
  sender: string;
  recipient: string;
  caption?: string;
  manifest?: { name: string; size: number; path?: string }[];
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export async function uploadDirectoryFolder(options: DirectoryUploadOptions): Promise<Message> {
  const {
    files,
    folderName,
    sender,
    recipient,
    caption = "",
    manifest = [],
    onProgress,
    signal,
  } = options;

  const fileList = Array.from(files);
  const totalFiles = fileList.length;
  let totalSizeBytes = 0;
  for (const f of fileList) {
    totalSizeBytes += f.size;
  }

  const uploadId = `dir_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const folderTypeInfo = identifyFolderType(folderName, manifest);

  let uploadedBytes = 0;
  let startTime = Date.now();
  let lastTime = startTime;
  let lastUploadedBytes = 0;

  const updateProgress = (
    status: UploadProgress["status"],
    extra: Partial<UploadProgress> = {}
  ) => {
    if (!onProgress) return;
    const now = Date.now();
    const timeDiffSec = Math.max(0.1, (now - lastTime) / 1000);
    const bytesDiff = uploadedBytes - lastUploadedBytes;
    const currentSpeedMBs = Number((bytesDiff / (1024 * 1024 * timeDiffSec)).toFixed(2));

    const remainingBytes = Math.max(0, totalSizeBytes - uploadedBytes);
    const avgSpeed = uploadedBytes / Math.max(0.1, (now - startTime) / 1000);
    const timeRemainingSec = avgSpeed > 0 ? Math.round(remainingBytes / avgSpeed) : 0;

    lastTime = now;
    lastUploadedBytes = uploadedBytes;

    onProgress({
      uploadId,
      filename: folderName,
      isFolder: true,
      folderTypeInfo,
      totalBytes: totalSizeBytes,
      uploadedBytes,
      percentage: totalSizeBytes > 0 ? Math.min(100, Math.round((uploadedBytes / totalSizeBytes) * 100)) : 100,
      speedMBs: currentSpeedMBs > 0 ? currentSpeedMBs : Number((avgSpeed / (1024 * 1024)).toFixed(2)),
      timeRemainingSec,
      status,
      ...extra,
    });
  };

  updateProgress("initializing");

  // 1. Initialize directory upload session
  const initRes = await fetch("/api/upload/directory/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId,
      folderName,
      totalFiles,
      totalSize: totalSizeBytes,
      manifest,
      sender,
      recipient,
      caption,
      folderType: folderTypeInfo?.typeName,
      folderBadge: folderTypeInfo?.badge,
    }),
    signal,
  });

  if (!initRes.ok) {
    const errData = await initRes.json().catch(() => ({}));
    const msg = errData.m || "Failed initializing directory upload session";
    updateProgress("error", { errorMessage: msg });
    throw new Error(msg);
  }

  // 2. Upload each file sequentially
  for (let i = 0; i < totalFiles; i++) {
    if (signal?.aborted) {
      updateProgress("cancelled");
      throw new Error("Directory upload cancelled");
    }

    const file = fileList[i];
    const relPath = (file as any).webkitRelativePath || file.name;

    const fileRes = await fetch("/api/upload/directory/file", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-upload-id": uploadId,
        "x-rel-path": encodeURIComponent(relPath),
      },
      body: file,
      signal,
    });

    if (!fileRes.ok) {
      const errData = await fileRes.json().catch(() => ({}));
      const msg = errData.m || `Failed uploading directory file: ${file.name}`;
      updateProgress("error", { errorMessage: msg });
      throw new Error(msg);
    }

    uploadedBytes += file.size;
    updateProgress("uploading");
  }

  // 3. Finalize and package with archiver
  updateProgress("finalizing");

  const completeRes = await fetch("/api/upload/directory/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
    signal,
  });

  if (!completeRes.ok) {
    const errData = await completeRes.json().catch(() => ({}));
    const msg = errData.m || "Failed packaging directory on server";
    updateProgress("error", { errorMessage: msg });
    throw new Error(msg);
  }

  const completeData = await completeRes.json();
  updateProgress("completed", { percentage: 100, uploadedBytes: totalSizeBytes });

  return completeData.message;
}
