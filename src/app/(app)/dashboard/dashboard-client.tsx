"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobTypeBadge } from "@/components/job-type-badge";
import { JOB_STATUS_LABELS } from "@/lib/types";
import type { JobWithVehicle } from "@/lib/types";

interface DashboardClientProps {
  jobs: JobWithVehicle[];
  stats: {
    totalJobs: number;
    totalVehicles: number;
    totalFiles: number;
    monthJobs: number;
  };
  businessName: string;
}

const statusColors: Record<string, string> = {
  done: "bg-green-500/15 text-green-400 border-green-500/20",
  warranty: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  reclamation: "bg-red-500/15 text-red-400 border-red-500/20",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export function DashboardClient({ jobs, stats, businessName }: DashboardClientProps) {
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const v = job.vehicles;
    return (
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.license_plate?.toLowerCase().includes(q) ?? false) ||
      (v.ecu_type?.toLowerCase().includes(q) ?? false) ||
      job.job_types.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{businessName || "Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">Munkák és járművek áttekintése</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
            Új munka
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Összes munka" value={stats.totalJobs} />
        <StatCard label="Járművek" value={stats.totalVehicles} />
        <StatCard label="Feltöltött fájlok" value={stats.totalFiles} />
        <StatCard label="Ez a hónap" value={stats.monthJobs} />
      </div>

      {/* Search */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <Input
          placeholder="Keresés rendszám, márka, ECU típus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {jobs.length === 0
              ? "Még nincs rögzített munka. Kattints az \"Új munka\" gombra!"
              : "Nincs találat a keresésre."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((job) => (
            <Link key={job.id} href={`/vehicles/${job.vehicle_id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {job.vehicles.brand} {job.vehicles.model}
                        </span>
                        {job.vehicles.stock_hp && job.result_hp && (
                          <span className="text-xs text-muted-foreground">
                            {job.vehicles.stock_hp} LE → <span className="text-green-400 font-medium">{job.result_hp} LE</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.vehicles.license_plate && (
                          <Badge variant="secondary" className="font-mono text-[11px] tracking-wider">
                            {job.vehicles.license_plate}
                          </Badge>
                        )}
                        {job.job_types.map((type) => (
                          <JobTypeBadge key={type} type={type} />
                        ))}
                        <Badge variant="outline" className={statusColors[job.status]}>
                          {JOB_STATUS_LABELS[job.status]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      {job.vehicles.ecu_type && (
                        <span className="font-mono">{job.vehicles.ecu_type}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${(job.file_count ?? 0) > 0 ? "bg-green-500" : "bg-gray-500"}`} />
                        <span>{job.file_count ?? 0} fájl</span>
                      </div>
                      <span>{new Date(job.job_date).toLocaleDateString("hu-HU")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
