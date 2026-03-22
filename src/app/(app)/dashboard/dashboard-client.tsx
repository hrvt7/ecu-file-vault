"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobTypeBadge } from "@/components/job-type-badge";
import { AnimatedNumber } from "@/components/animated-number";
import { JOB_STATUS_LABELS } from "@/lib/types";
import type { JobWithVehicle } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Wrench,
  Car,
  HardDrive,
  CalendarDays,
  Search,
  PlusCircle,
  Cpu,
  ArrowRight,
  Share2,
} from "lucide-react";

interface DashboardClientProps {
  jobs: JobWithVehicle[];
  stats: {
    totalJobs: number;
    totalVehicles: number;
    totalFiles: number;
    monthJobs: number;
    sharedVehicles: number;
  };
  businessName: string;
}

const statusColors: Record<string, string> = {
  done: "bg-green-500/10 text-green-400",
  warranty: "bg-yellow-500/10 text-yellow-400",
  reclamation: "bg-red-500/10 text-red-400",
  in_progress: "bg-blue-500/10 text-blue-400",
};

const statCards = [
  { key: "totalJobs" as const, label: "ÖSSZES MUNKA", icon: Wrench, accent: "from-blue-500/10" },
  { key: "totalVehicles" as const, label: "JÁRMŰVEK", icon: Car, accent: "from-emerald-500/10" },
  { key: "totalFiles" as const, label: "FÁJLOK", icon: HardDrive, accent: "from-purple-500/10" },
  { key: "monthJobs" as const, label: "EZ A HÓNAP", icon: CalendarDays, accent: "from-cyan-500/10" },
  { key: "sharedVehicles" as const, label: "MEGOSZTOTT", icon: Share2, accent: "from-amber-500/10" },
];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Ma";
  if (diff === 1) return "Tegnap";
  if (diff < 7) return `${diff} napja`;
  return date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
}

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {businessName || "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Munkák és járművek áttekintése
          </p>
        </div>
        <Link href="/jobs/new">
          <Button className="btn-gradient border-0 text-white font-medium">
            <PlusCircle className="mr-2 h-4 w-4" />
            Új munka
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.key}
              className={cn(
                "glass-card overflow-hidden animate-fade-in-up",
                `stagger-${i + 1}`
              )}
            >
              <CardContent className="p-4 relative">
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
                    stat.accent
                  )}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <Icon className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <AnimatedNumber
                    value={stats[stat.key]}
                    className="text-[28px] font-bold tracking-tight tabular-nums font-[var(--font-jetbrains)]"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up stagger-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Keresés rendszám, márka, ECU típus alapján..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-card/50 backdrop-blur-sm border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-all text-sm"
        />
      </div>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <Card className="glass-card animate-fade-in-up stagger-6">
          <CardContent className="py-16 text-center">
            {jobs.length === 0 ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Wrench className="h-7 w-7 text-primary" />
                </div>
                <p className="font-medium">Még nincs rögzített munka</p>
                <p className="text-sm text-muted-foreground">
                  Kattints az &quot;Új munka&quot; gombra az első rögzítéshez!
                </p>
                <Link href="/jobs/new">
                  <Button className="btn-gradient border-0 text-white mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Első munka rögzítése
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="text-muted-foreground">Nincs találat a keresésre.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((job, i) => (
            <Link key={job.id} href={`/vehicles/${job.vehicle_id}`}>
              <Card
                className={cn(
                  "glass-card card-hover cursor-pointer animate-fade-in-up",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left side */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top row: car name + plate */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-[15px] tracking-[-0.01em]">
                          {job.vehicles.brand} {job.vehicles.model}
                        </span>
                        {job.vehicles.license_plate && (
                          <span className="inline-flex items-center rounded-md bg-secondary/80 border border-border/50 px-2 py-0.5 font-[var(--font-jetbrains)] text-[11px] font-medium tracking-wider text-muted-foreground">
                            {job.vehicles.license_plate}
                          </span>
                        )}
                      </div>

                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {job.job_types.map((type) => (
                          <JobTypeBadge key={type} type={type} />
                        ))}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                            statusColors[job.status]
                          )}
                        >
                          {JOB_STATUS_LABELS[job.status]}
                        </span>
                      </div>

                      {/* Power results */}
                      {(job.result_hp || job.result_nm) && (
                        <div className="flex items-center gap-3 text-sm">
                          {job.vehicles.stock_hp && job.result_hp && (
                            <span className="flex items-center gap-1.5">
                              <span className="text-muted-foreground font-[var(--font-jetbrains)] text-xs tabular-nums">
                                {job.vehicles.stock_hp} LE
                              </span>
                              <ArrowRight className="h-3 w-3 text-primary" />
                              <span className="text-green-400 font-semibold font-[var(--font-jetbrains)] text-xs tabular-nums">
                                {job.result_hp} LE
                              </span>
                              <span className="text-green-400 font-bold text-sm font-[var(--font-jetbrains)] tabular-nums power-glow">
                                +{job.result_hp - job.vehicles.stock_hp}
                              </span>
                            </span>
                          )}
                          {job.vehicles.stock_nm && job.result_nm && (
                            <span className="text-muted-foreground/70 text-xs font-[var(--font-jetbrains)] tabular-nums">
                              {job.result_nm} Nm
                              <span className="text-green-400/70 ml-1">
                                (+{job.result_nm - job.vehicles.stock_nm})
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 sm:flex-col sm:items-end sm:gap-2">
                      {job.vehicles.ecu_type && (
                        <span className="inline-flex items-center gap-1 font-[var(--font-jetbrains)] text-[11px]">
                          <Cpu className="h-3 w-3" />
                          {job.vehicles.ecu_type}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            (job.file_count ?? 0) > 0 ? "bg-green-500" : "bg-muted-foreground/30"
                          )}
                        />
                        <span className="text-[11px]">
                          {(job.file_count ?? 0) > 0
                            ? `${job.file_count} fájl`
                            : "Nincs fájl"}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground/60">
                        {formatRelativeDate(job.job_date)}
                      </span>
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
