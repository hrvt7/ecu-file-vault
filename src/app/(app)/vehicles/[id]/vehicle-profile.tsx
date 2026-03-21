"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Props {
  vehicle: Vehicle & { customers?: { name: string } | null };
  jobs: Job[];
  files: FileRecord[];
}

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
    } catch (err) {
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

  const statusColors: Record<string, string> = {
    done: "bg-green-500/15 text-green-400 border-green-500/20",
    warranty: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    reclamation: "bg-red-500/15 text-red-400 border-red-500/20",
    in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Vehicle info card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">
              {vehicle.brand} {vehicle.model}
            </CardTitle>
            {vehicle.customers?.name && (
              <p className="text-sm text-muted-foreground mt-1">
                Ügyfél: {vehicle.customers.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger
                render={(props) => (
                  <Button {...props} variant="destructive" size="sm">
                    Törlés
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {vehicle.license_plate && (
              <div>
                <p className="text-muted-foreground text-xs">Rendszám</p>
                <p className="font-mono font-medium">{vehicle.license_plate}</p>
              </div>
            )}
            {vehicle.year && (
              <div>
                <p className="text-muted-foreground text-xs">Évjárat</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
            )}
            {vehicle.engine && (
              <div>
                <p className="text-muted-foreground text-xs">Motor</p>
                <p className="font-medium">{vehicle.engine}</p>
              </div>
            )}
            {vehicle.engine_code && (
              <div>
                <p className="text-muted-foreground text-xs">Motorkód</p>
                <p className="font-mono font-medium">{vehicle.engine_code}</p>
              </div>
            )}
            {vehicle.ecu_type && (
              <div>
                <p className="text-muted-foreground text-xs">ECU típus</p>
                <p className="font-mono font-medium">{vehicle.ecu_type}</p>
              </div>
            )}
            {vehicle.stock_hp && (
              <div>
                <p className="text-muted-foreground text-xs">Gyári teljesítmény</p>
                <p className="font-medium">
                  {vehicle.stock_hp} LE{vehicle.stock_nm ? ` / ${vehicle.stock_nm} Nm` : ""}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Munkák ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Még nincs rögzített munka ennél a járműnél.
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => {
            const jobFiles = filesByJob.get(job.id) || [];
            return (
              <Card key={job.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {job.job_types.map((type) => (
                        <JobTypeBadge key={type} type={type} />
                      ))}
                      <Badge variant="outline" className={statusColors[job.status]}>
                        {JOB_STATUS_LABELS[job.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.job_date).toLocaleDateString("hu-HU")}
                      </span>
                      <Dialog>
                        <DialogTrigger
                          render={(props) => (
                            <Button {...props} variant="ghost" size="icon" className="h-7 w-7">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              Igen, törlöm
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {(job.result_hp || job.result_nm) && (
                    <div className="flex gap-4 text-sm">
                      {job.result_hp && (
                        <span>
                          <span className="text-muted-foreground">Eredmény: </span>
                          <span className="text-green-400 font-semibold">{job.result_hp} LE</span>
                          {vehicle.stock_hp && (
                            <span className="text-muted-foreground"> (+{job.result_hp - vehicle.stock_hp})</span>
                          )}
                        </span>
                      )}
                      {job.result_nm && (
                        <span>
                          <span className="text-green-400 font-semibold">{job.result_nm} Nm</span>
                          {vehicle.stock_nm && (
                            <span className="text-muted-foreground"> (+{job.result_nm - vehicle.stock_nm})</span>
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {job.file_source && (
                    <p className="text-xs text-muted-foreground">
                      Forrás: {job.file_source}
                    </p>
                  )}

                  {job.notes && (
                    <p className="text-sm text-muted-foreground">{job.notes}</p>
                  )}

                  {jobFiles.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Fájlok ({jobFiles.length})
                        </p>
                        {jobFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-muted/30 rounded px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {file.file_category}
                              </Badge>
                              <span className="text-sm truncate">{file.file_name}</span>
                              <span className="text-[11px] text-muted-foreground shrink-0">
                                {file.file_size
                                  ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB`
                                  : ""}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 h-7"
                              onClick={() => handleDownload(file)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                              Letöltés
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
