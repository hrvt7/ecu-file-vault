export type FileCategory = "original" | "modified" | "dyno_report" | "other";

interface CategorizedFile {
  file: File;
  category: FileCategory;
  relativePath: string;
  selected: boolean;
}

// Extension-based categorization (lowest priority)
const extensionMap: Record<string, FileCategory> = {
  ".bin": "original",
  ".ori": "original",
  ".original": "original",
  ".mod": "modified",
  ".modified": "modified",
  ".tuned": "modified",
  ".pdf": "dyno_report",
  ".jpg": "dyno_report",
  ".jpeg": "dyno_report",
  ".png": "dyno_report",
  ".bmp": "dyno_report",
  ".csv": "other",
  ".log": "other",
};

// Filename keyword patterns (medium priority)
const filenamePatterns: { keywords: string[]; category: FileCategory }[] = [
  {
    keywords: ["orig", "stock", "eredeti", "original", "gyari", "gyári"],
    category: "original",
  },
  {
    keywords: ["mod", "tuned", "stage", "tunolt", "modified"],
    category: "modified",
  },
  {
    keywords: ["dyno", "meres", "mérés", "pad", "riport", "report", "measurement"],
    category: "dyno_report",
  },
];

// Folder name patterns (highest priority)
const folderPatterns: { keywords: string[]; category: FileCategory }[] = [
  {
    keywords: ["original", "stock", "eredeti", "gyári", "gyari"],
    category: "original",
  },
  {
    keywords: ["modified", "tuned", "stage", "tunolt", "mod"],
    category: "modified",
  },
  {
    keywords: ["dyno", "results", "reports", "riport", "meres"],
    category: "dyno_report",
  },
];

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function categorizeFile(file: File, relativePath: string): FileCategory {
  const ext = getExtension(file.name);
  const nameLower = file.name.toLowerCase();

  // 1. Extension-based (lowest priority)
  let category: FileCategory = extensionMap[ext] ?? "other";

  // 2. Filename heuristic (overrides extension)
  for (const pattern of filenamePatterns) {
    if (matchKeywords(nameLower, pattern.keywords)) {
      category = pattern.category;
      break;
    }
  }

  // 3. Folder name heuristic (highest priority)
  const pathParts = relativePath.split("/").slice(0, -1); // exclude filename
  for (const part of pathParts) {
    for (const pattern of folderPatterns) {
      if (matchKeywords(part, pattern.keywords)) {
        return pattern.category; // Return immediately — highest priority
      }
    }
  }

  return category;
}

export function categorizeFiles(fileList: FileList): CategorizedFile[] {
  const result: CategorizedFile[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    // webkitRelativePath gives path like "foldername/subfolder/file.bin"
    const relativePath =
      (file as any).webkitRelativePath || file.name;

    // Skip hidden files and system files
    if (file.name.startsWith(".") || file.name === "Thumbs.db" || file.name === "desktop.ini") {
      continue;
    }

    const category = categorizeFile(file, relativePath);
    result.push({
      file,
      category,
      relativePath,
      selected: true,
    });
  }

  return result;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const categoryLabels: Record<FileCategory, string> = {
  original: "Eredeti ECU",
  modified: "Tunolt ECU",
  dyno_report: "Dyno riport",
  other: "Egyéb",
};

export const categoryColors: Record<FileCategory, string> = {
  original: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  modified: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  dyno_report: "bg-green-500/15 text-green-400 border-green-500/20",
  other: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

// Light theme variants (for share page or light contexts)
export const categoryColorsLight: Record<FileCategory, string> = {
  original: "bg-blue-100 text-blue-700",
  modified: "bg-amber-100 text-amber-700",
  dyno_report: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-600",
};

export function isImageFile(filename: string): boolean {
  const ext = getExtension(filename);
  return [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"].includes(ext);
}

export function isPdfFile(filename: string): boolean {
  return getExtension(filename) === ".pdf";
}

export function isBinaryFile(filename: string): boolean {
  const ext = getExtension(filename);
  return [".bin", ".ori", ".original", ".mod", ".modified", ".tuned"].includes(ext);
}
