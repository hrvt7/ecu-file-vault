"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JobTypeBadge } from "@/components/job-type-badge";
import { JOB_STATUS_LABELS } from "@/lib/types";
import type { Vehicle, Job, FileRecord } from "@/lib/types";
import { deleteVehicle, deleteJob, getSignedDownloadUrl } from "@/app/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Cpu,
  ArrowRight,
  Download,
  Trash2,
  Calendar,
  Gauge,
  FileText,
  Car,
} from "lucide-react";

interface Props {
  vehicle: Vehicle & { customers?: { name: string } | null };
  jobs: Job[];
  files: FileRecord[];
}

const statusColors: Record<string, string> = {
  done: "bg-green-500/10 text-green-400",
  warranty: "bg-yellow-500/10 text-yellow-400",
  reclamation: "bg-red-500/10 text-red-400",
  in_progress: "bg-blue-500/10 text-blue-400",
};

const statusDotColors: Record<string, string> = {
  done: "bg-green-400",
  warranty: "bg-yellow-400",
  reclamation: "bg-red-400",
  in_progress: "bg-blue-400",
};

export function VehicleProfile({ vehicle, jobs, files }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const filesByJob = new Map<string, FileRecord[]>();
  files.forEach((f) => {
    const existing = filesByJob.get(f.job_id) || [];
    existing.push(f);
    filesByJob.set(f.job_id, existing);
  });

  async function handleDeleteVehicle() {
    setDeleting(true);
    try {
      await deleteVehicle(vehicle.id);
    } catch {
      toast.error("Hiba a törlés során");
      setDeleting(false);
    }
  }

  async function handleDeleteJob(jobId: string) {
    try {
      await deleteJob(jobId, vehicle.id);
      toast.success("Munka törölve");
      router.refresh();
    } catch {
      toast.error("Hiba a törlés során");
    }
  }

  async function handleDownload(file: FileRecord) {
    try {
      const url = await getSignedDownloadUrl(file.storage_path);
      window.open(url, "_blank");
    } catch {
      toast.error("Nem sikerült letölteni a fájlt");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Hero section */}
      <Card className="glass-card overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="relative flex flex-row items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-xl font-bold text-muted-foreground shrink-0">
              {vehicle.brand.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xl tracking-[-0.02em]">
                {vehicle.brand} {vehicle.model}
              </CardTitle>
              {vehicle.customers?.name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Ügyfél: {vehicle.customers.name}
                </p>
              )}
            </div>
          </div>
          <Dialog>
            <DialogTrigger
              render={(props) => (
                <Button {...props} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Jármű törlése</DialogTitle>
                <DialogDescription>
                  Biztosan törölni akarod a járművet és az összes hozzá tartozó munkát?
                  Ez a művelet nem vonható vissza.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleDeleteVehicle}
                  disabled={deleting}
                >
                  {deleting ? "Törlés..." : "Igen, törlöm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {vehicle.license_plate && (
              <InfoItem
                label="Rendszám"
                value={vehicle.license_plate}
                mono
              />
            )}
            {vehicle.year && (
              <InfoItem label="Évjárat" value={String(vehicle.year)} />
            )}
            {vehicle.engine && (
              <InfoItem label="Motor" value={vehicle.engine} />
            )}
            {vehicle.engine_code && (
              <InfoItem label="Motorkód" value={vehicle.engine_code} mono />
            )}
            {vehicle.ecu_type && (
              <InfoItem label="ECU típus" value={vehicle.ecu_type} mono icon={<Cpu className="h-3 w-3" />} />
            )}
            {vehicle.stock_hp && (
              <InfoItem
                label="Gyári teljesítmény"
                value={`${vehicle.stock_hp} LE${vehicle.stock_nm ? ` / ${vehicle.stock_nm} Nm` : ""}`}
                mono
                icon={<Gauge className="h-3 w-3" />}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs timeline */}
      <div className="space-y-4 animate-fade-in-up stagger-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em] flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Munkák ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <div className="space-y-2">
                <Car className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Még nincs rögzített munka ennél a járműnél.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50 hidden sm:block" />

            <div className="space-y-3">
              {jobs.map((job, i) => {
                const jobFiles = filesByJob.get(job.id) || [];
                return (
                  <div key={job.id} className="relative sm:pl-10">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-[13px] top-5 h-2.5 w-2.5 rounded-full border-2 border-background hidden sm:block",
                        statusDotColors[job.status] ?? "bg-muted-foreground"
                      )}
                    />

                    <Card className={cn("glass-card animate-fade-in-up", `stagger-${Math.min(i + 1, 6)}`)}>
                      <CardContent className="p-4 space-y-3">
                        {/* Header row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {job.job_types.map((type) => (
                              <JobTypeBadge key={type} type={type} />
                            ))}
                            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", statusColors[job.status])}>
                              {JOB_STATUS_LABELS[job.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground/60">
                              {new Date(job.job_date).toLocaleDateString("hu-HU")}
                            </span>
                            <Dialog>
                              <DialogTrigger
                                render={(props) => (
                                  <Button {...props} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              />
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Munka törlése</DialogTitle>
                                  <DialogDescription>
                                    Biztosan törölni akarod ezt a munkát és az összes fájlját?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="destructive" onClick={() => handleDeleteJob(job.id)}>
                                    Igen, törlöm
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        {/* Power results */}
                        {(job.result_hp || job.result_nm) && (
                          <div className="flex items-center gap-4">
                            {job.result_hp && (
                              <span className="flex items-center gap-1.5">
                                <span className="text-muted-foreground font-[var(--font-jetbrains)] text-xs tabular-nums">
                                  {vehicle.stock_hp ?? "?"} LE
                                </span>
                                <ArrowRight className="h-3 w-3 text-primary" />
                                <span className="text-green-400 font-semibold font-[var(--font-jetbrains)] text-sm tabular-nums">
                                  {job.result_hp} LE
                                </span>
                                {vehicle.stock_hp && (
                                  <span className="text-green-400 font-bold text-base font-[var(--font-jetbrains)] tabular-nums power-glow">
                                    +{job.result_hp - vehicle.stock_hp}
                                  </span>
                                )}
                              </span>
                            )}
                            {job.result_nm && (
                              <span className="text-muted-foreground/70 text-xs font-[var(--font-jetbrains)] tabular-nums">
                                {job.result_nm} Nm
                                {vehicle.stock_nm && (
                                  <span className="text-green-400/60 ml-1">
                                    (+{job.result_nm - vehicle.stock_nm})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        {job.file_source && (
                          <p className="text-[11px] text-muted-foreground/60">
                            Forrás: {job.file_source}
                          </p>
                        )}

                        {job.notes && (
                          <p className="text-sm text-muted-foreground/80">{job.notes}</p>
                        )}

                        {/* Files */}
                        {jobFiles.length > 0 && (
                          <>
                            <Separator className="opacity-30" />
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Fájlok ({jobFiles.length})
                              </p>
                              {jobFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 bg-secondary/80 rounded px-1.5 py-0.5 shrink-0">
                                      {file.file_category}
                                    </span>
                                    <span className="text-sm truncate">{file.file_name}</span>
                                    {file.file_size && (
                                      <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
                                        {(file.file_size / 1024 / 1024).toFixed(1)} MB
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 h-7 text-primary hover:text-primary"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDownload(file);
                                    }}
                                  >
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Letöltés
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground/60 mb-0.5">
        {label}
      </p>
      <p
        className={cn(
          "font-medium text-sm flex items-center gap-1",
          mono && "font-[var(--font-jetbrains)] tabular-nums"
        )}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
