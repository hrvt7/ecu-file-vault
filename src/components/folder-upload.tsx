"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Cpu,
  FileText,
  ImageIcon,
  Check,
  X,
  Loader2,
  Upload,
} from "lucide-react";
import {
  categorizeFiles,
  formatFileSize,
  categoryLabels,
  categoryColors,
  isImageFile,
  isPdfFile,
  isBinaryFile,
  type FileCategory,
} from "@/lib/file-categories";

export interface UploadableFile {
  file: File;
  category: FileCategory;
  relativePath: string;
  selected: boolean;
}

interface FolderUploadProps {
  onFilesReady: (files: UploadableFile[]) => void;
  existingFiles?: UploadableFile[];
}

export function FolderUpload({ onFilesReady, existingFiles }: FolderUploadProps) {
  const [files, setFiles] = useState<UploadableFile[]>(existingFiles ?? []);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const categorized = categorizeFiles(fileList);
      setFiles(categorized);
      onFilesReady(categorized);
    },
    [onFilesReady]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleFile = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      onFilesReady(next);
      return next;
    });
  };

  const updateCategory = (index: number, category: FileCategory) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], category };
      onFilesReady(next);
      return next;
    });
  };

  const selectAll = (selected: boolean) => {
    setFiles((prev) => {
      const next = prev.map((f) => ({ ...f, selected }));
      onFilesReady(next);
      return next;
    });
  };

  const selectedFiles = files.filter((f) => f.selected);
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);

  if (files.length === 0) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleInputChange}
          {...{ webkitdirectory: "", directory: "", multiple: true } as any}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 min-h-[120px] flex flex-col items-center justify-center gap-2",
            dragOver
              ? "border-primary bg-primary/10 border-solid"
              : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
          )}
        >
          <FolderOpen
            className={cn(
              "h-8 w-8 transition-colors",
              dragOver ? "text-primary" : "text-muted-foreground/40"
            )}
          />
          <p className="text-sm text-muted-foreground">
            Húzd ide a mappát vagy kattints a kiválasztáshoz
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            Támogatott fájlok: .bin, .ori, .mod, .pdf, .jpg, .png, .csv
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{selectedFiles.length}</span> fájl
          kiválasztva ({formatFileSize(totalSize)})
        </span>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => selectAll(true)}
            className="text-primary hover:underline"
          >
            Összes kijelölése
          </button>
          <button
            type="button"
            onClick={() => selectAll(false)}
            className="text-muted-foreground hover:underline"
          >
            Kijelölés törlése
          </button>
        </div>
      </div>

      {/* File list */}
      <ScrollArea className={cn(files.length > 8 && "h-[360px]")}>
        <div className="space-y-0.5">
          {files.map((f, i) => (
            <div
              key={`${f.relativePath}-${i}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                i % 2 === 0 ? "bg-secondary/20" : "",
                !f.selected && "opacity-40"
              )}
            >
              {/* Checkbox */}
              <Checkbox
                checked={f.selected}
                onCheckedChange={() => toggleFile(i)}
                className="shrink-0"
              />

              {/* Thumbnail / Icon */}
              <div className="h-9 w-9 rounded bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden">
                {isImageFile(f.file.name) ? (
                  <ImageThumbnail file={f.file} />
                ) : isPdfFile(f.file.name) ? (
                  <FileText className="h-4 w-4 text-red-400" />
                ) : isBinaryFile(f.file.name) ? (
                  <Cpu className="h-4 w-4 text-blue-400" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={f.relativePath}>
                  {f.file.name}
                </p>
                <p className="text-[11px] text-muted-foreground/60 truncate">
                  {f.relativePath.includes("/")
                    ? f.relativePath.split("/").slice(0, -1).join("/")
                    : ""}{" "}
                  · {formatFileSize(f.file.size)}
                </p>
              </div>

              {/* Category badge + dropdown */}
              <Select
                value={f.category}
                onValueChange={(val) => updateCategory(i, (val ?? f.category) as FileCategory)}
              >
                <SelectTrigger
                  className={cn(
                    "w-36 h-7 text-[11px] font-medium border-0",
                    categoryColors[f.category]
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">{categoryLabels.original}</SelectItem>
                  <SelectItem value="modified">{categoryLabels.modified}</SelectItem>
                  <SelectItem value="dyno_report">{categoryLabels.dyno_report}</SelectItem>
                  <SelectItem value="other">{categoryLabels.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Change folder button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setFiles([]);
            onFilesReady([]);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Másik mappa kiválasztása
        </button>
      </div>
    </div>
  );
}

/* Upload progress component */
export function UploadProgress({
  total,
  uploaded,
  currentFile,
  errors,
}: {
  total: number;
  uploaded: number;
  currentFile: string;
  errors: string[];
}) {
  const pct = total > 0 ? Math.round((uploaded / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {uploaded}/{total} fájl feltöltve
        </span>
        <span className="font-medium tabular-nums font-[var(--font-jetbrains)]">
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {currentFile && (
        <p className="text-[11px] text-muted-foreground/60 truncate">
          Feltöltés: {currentFile}
        </p>
      )}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-[11px] text-red-400 flex items-center gap-1">
              <X className="h-3 w-3" />
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* Image thumbnail from File object */
function ImageThumbnail({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);

  if (!src) {
    const url = URL.createObjectURL(file);
    setSrc(url);
  }

  return src ? (
    <img
      src={src}
      alt={file.name}
      className="h-9 w-9 object-cover rounded"
      onLoad={() => {
        // Don't revoke — we need it for display
      }}
    />
  ) : (
    <ImageIcon className="h-4 w-4 text-muted-foreground" />
  );
}
