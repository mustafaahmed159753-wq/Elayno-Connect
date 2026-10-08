export interface FolderTypeInfo {
  typeName: string;
  category: "medical" | "archive" | "backup" | "code" | "disk" | "bundle" | "dataset" | "cad" | "docs" | "media" | "general";
  badge: string;
  badgeColor: string;
  iconName: "hospital" | "archive" | "database" | "code" | "disc" | "package" | "bar-chart" | "pen-tool" | "file-text" | "video" | "folder";
  description: string;
  isArchiveExtension: boolean;
}

/**
 * Extracts composite extension (e.g. .tar.gz, .tar.bz2, .tar.xz, .nii.gz, .dcm) or standard extension
 */
export function getFolderExtension(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower.endsWith(".tar.gz")) return ".tar.gz";
  if (lower.endsWith(".tar.bz2")) return ".tar.bz2";
  if (lower.endsWith(".tar.xz")) return ".tar.xz";
  if (lower.endsWith(".tar.zst")) return ".tar.zst";
  if (lower.endsWith(".nii.gz")) return ".nii.gz";
  if (lower.endsWith(".dicomdir")) return ".dicomdir";

  const parts = lower.split(".");
  if (parts.length > 1) {
    return "." + parts.pop()!;
  }
  return "";
}

/**
 * Identifies the folder type from its extension, folder name, and optional file manifest
 */
export function identifyFolderType(
  folderName: string,
  filesList: { name: string; path?: string }[] = []
): FolderTypeInfo {
  const ext = getFolderExtension(folderName);
  const nameLower = folderName.toLowerCase();

  // 1. Medical Imaging (DICOM, NIfTI, SVS Pathology)
  if (
    ext === ".dcm" ||
    ext === ".dicom" ||
    ext === ".dicomdir" ||
    ext === ".nii" ||
    ext === ".nii.gz" ||
    ext === ".svs" ||
    ext === ".mhd" ||
    nameLower.includes("dicom") ||
    nameLower.includes("ct_scan") ||
    nameLower.includes("mri") ||
    nameLower.includes("xray") ||
    nameLower.includes("pathology") ||
    filesList.some((f) => {
      const fn = f.name.toLowerCase();
      return fn.endsWith(".dcm") || fn === "dicomdir" || fn.endsWith(".nii") || fn.endsWith(".nii.gz");
    })
  ) {
    const isNifti = ext === ".nii" || ext === ".nii.gz";
    return {
      typeName: isNifti ? "NIfTI Neuroimaging Volumetric Folder" : "DICOM Medical Imaging Study Folder",
      category: "medical",
      badge: isNifti ? "NIFTI SCAN" : "DICOM SCAN",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      iconName: "hospital",
      description: "Medical Imaging Series • High-Resolution Diagnostic Slices (CT / MRI / X-Ray / Pathology)",
      isArchiveExtension: ext === ".dcm" || ext === ".dicom" || isNifti,
    };
  }

  // 2. ZIP Archive
  if (ext === ".zip" || ext === ".zipx") {
    return {
      typeName: "ZIP Compressed Archive Folder",
      category: "archive",
      badge: "ZIP ARCHIVE",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      iconName: "archive",
      description: "Standard Compressed Archive • Contains bundled directory files",
      isArchiveExtension: true,
    };
  }

  // 3. Tarballs (.tar, .tar.gz, .tgz, .tar.bz2, .tar.xz, .tar.zst)
  if ([".tar", ".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tar.xz", ".txz", ".tar.zst"].includes(ext)) {
    return {
      typeName: ext.includes(".gz") || ext === ".tgz"
        ? "GZIP Tarball Archive (.tar.gz)"
        : ext.includes(".bz2")
        ? "BZIP2 Tarball Archive (.tar.bz2)"
        : ext.includes(".xz")
        ? "XZ Tarball Archive (.tar.xz)"
        : "UNIX Tape Archive (.tar)",
      category: "archive",
      badge: ext.toUpperCase().replace(".", ""),
      badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      iconName: "archive",
      description: "High-density UNIX Tarball archive preserving directory permissions & structure",
      isArchiveExtension: true,
    };
  }

  // 4. 7-Zip, RAR, Zstandard
  if (ext === ".7z" || ext === ".rar" || ext === ".zst" || ext === ".cab" || ext === ".arj") {
    return {
      typeName: ext === ".7z" ? "7-Zip High-Ratio Archive" : ext === ".rar" ? "WinRAR Compressed Volume" : "Zstandard Archive",
      category: "archive",
      badge: ext.toUpperCase().replace(".", ""),
      badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      iconName: "archive",
      description: "High-compression multi-stream archive volume",
      isArchiveExtension: true,
    };
  }

  // 5. Disk Images & Virtual Volumes (.iso, .img, .vhd, .vmdk, .dmg, .wim, .esd)
  if ([".iso", ".img", ".vhd", ".vhdx", ".vmdk", ".dmg", ".wim", ".esd", ".qcow2"].includes(ext)) {
    return {
      typeName: ext === ".iso"
        ? "ISO Optical Disk Image"
        : ext === ".dmg"
        ? "macOS Disk Image Volume"
        : ext === ".wim" || ext === ".esd"
        ? "Windows Imaging Format (WIM/ESD)"
        : "Virtual Machine Disk Volume",
      category: "disk",
      badge: ext.toUpperCase().replace(".", ""),
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      iconName: "disc",
      description: "Mountable filesystem image / Virtual storage volume (Supports 2-3 GB+)",
      isArchiveExtension: true,
    };
  }

  // 6. Backups & Database Dumps (.bak, .backup, .dump, .sql, .db, .sqlite, .mdb)
  if (
    [".bak", ".backup", ".dump", ".sql", ".sqlite", ".db", ".mdb", ".accdb"].includes(ext) ||
    nameLower.includes("backup") ||
    nameLower.includes("db_dump")
  ) {
    return {
      typeName: "System & Database Backup Archive",
      category: "backup",
      badge: ext ? ext.toUpperCase().replace(".", "") : "BACKUP",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      iconName: "database",
      description: "Encrypted or structured database snapshot and recovery data (Supports 2-3 GB+)",
      isArchiveExtension: true,
    };
  }

  // 7. Software Bundles & Packages (.app, .bundle, .pkg, .apk, .ipa, .deb, .rpm)
  if ([".app", ".bundle", ".pkg", ".apk", ".ipa", ".deb", ".rpm"].includes(ext)) {
    return {
      typeName: ext === ".app"
        ? "macOS Application Bundle"
        : ext === ".apk"
        ? "Android Package Package"
        : ext === ".deb" || ext === ".rpm"
        ? "Linux Package Archive"
        : "Software Application Bundle",
      category: "bundle",
      badge: ext.toUpperCase().replace(".", ""),
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      iconName: "package",
      description: "Self-contained executable software package with assets and binaries",
      isArchiveExtension: true,
    };
  }

  // 8. CAD & Engineering Projects (.dwg, .dxf, .prj, .project, .cad, .blend, .step, .stp, .stl)
  if ([".dwg", ".dxf", ".prj", ".project", ".cad", ".blend", ".step", ".stp", ".stl", ".iges", ".igs"].includes(ext)) {
    return {
      typeName: "CAD & Engineering Project Folder",
      category: "cad",
      badge: ext.toUpperCase().replace(".", ""),
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      iconName: "pen-tool",
      description: "Computer-Aided Design drawings, blueprints, and 3D architectural assemblies",
      isArchiveExtension: true,
    };
  }

  // 9. Data Science / ML Datasets (.dataset, .data, .parquet, .csvs, .arrow, .feather, .h5, .hdf5, .safetensors)
  if (
    [".dataset", ".data", ".parquet", ".csvs", ".arrow", ".feather", ".h5", ".hdf5", ".safetensors"].includes(ext) ||
    nameLower.includes("dataset")
  ) {
    return {
      typeName: "Research & Clinical Dataset Folder",
      category: "dataset",
      badge: ext ? ext.toUpperCase().replace(".", "") : "DATASET",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      iconName: "bar-chart",
      description: "Structured medical research and analytics batch data (Supports 2-3 GB+)",
      isArchiveExtension: true,
    };
  }

  // 10. Code Repository (Inspecting nested files or .git)
  if (
    ext === ".git" ||
    nameLower.includes("repo") ||
    filesList.some((f) => [".ts", ".tsx", ".js", ".jsx", ".json", ".py", ".cpp", ".c", ".java"].some((e) => f.name.endsWith(e))) ||
    filesList.some((f) => f.name === "package.json" || f.name === "tsconfig.json")
  ) {
    return {
      typeName: "Software Source Code Project Folder",
      category: "code",
      badge: "CODE PROJECT",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      iconName: "code",
      description: "Source code repository with program files and project configuration",
      isArchiveExtension: false,
    };
  }

  // 11. Clinical Documents & Reports
  if (
    filesList.some((f) => [".pdf", ".docx", ".doc", ".xlsx", ".csv"].some((e) => f.name.endsWith(e))) ||
    nameLower.includes("report") ||
    nameLower.includes("patient") ||
    nameLower.includes("doc")
  ) {
    return {
      typeName: "Clinical Documents & Reports Folder",
      category: "docs",
      badge: "DOCUMENTS",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      iconName: "file-text",
      description: "Patient charts, diagnostic paperwork, laboratory results, and office spreadsheets",
      isArchiveExtension: false,
    };
  }

  // 12. Media & Recordings
  if (
    filesList.some((f) => [".mp4", ".mov", ".avi", ".mkv", ".mp3", ".wav", ".flac"].some((e) => f.name.endsWith(e))) ||
    nameLower.includes("media") ||
    nameLower.includes("video") ||
    nameLower.includes("audio")
  ) {
    return {
      typeName: "Media & Surveillance Recordings Folder",
      category: "media",
      badge: "MEDIA FOLDER",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
      iconName: "video",
      description: "High-definition video clips, voice memos, and surgery recordings",
      isArchiveExtension: false,
    };
  }

  // Fallback: Generic Directory Folder
  const extLabel = ext ? ext.toUpperCase().replace(".", "") : "FOLDER";
  return {
    typeName: ext ? `${extLabel} Package Folder` : "Directory Folder",
    category: "general",
    badge: ext ? extLabel : "FOLDER",
    badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    iconName: "folder",
    description: "Hierarchical filesystem directory containing files and sub-folders",
    isArchiveExtension: Boolean(ext),
  };
}
