"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobTypeBadge } from "@/components/job-type-badge";
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
  Zap,
  FolderOpen,
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

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  done: { bg: "bg-[rgba(16,185,129,0.1)]", text: "text-[#10b981]", dot: "bg-[#10b981]" },
  warranty: { bg: "bg-[rgba(245,158,11,0.1)]", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
  reclamation: { bg: "bg-[rgba(239,68,68,0.1)]", text: "text-[#ef4444]", dot: "bg-[#ef4444]" },
  in_progress: { bg: "bg-[rgba(14,165,233,0.1)]", text: "text-[#0ea5e9]", dot: "bg-[#0ea5e9]" },
};

const statCards = [
  { key: "totalJobs" as const, label: "ÖSSZES MUNKA", icon: Wrench, highlight: false },
  { key: "totalVehicles" as const, label: "JÁRMŰVEK", icon: Car, highlight: false },
  { key: "totalFiles" as const, label: "FÁJLOK", icon: HardDrive, highlight: false },
  { key: "monthJobs" as const, label: "EZ A HÓNAP", icon: CalendarDays, highlight: true },
  { key: "sharedVehicles" as const, label: "MEGOSZTOTT", icon: Share2, highlight: false },
];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Ma";
  if (diff === 1) return "Tegnap";
  if (diff < 7) return `${diff} napja`;
  if (diff < 30) return `${Math.floor(diff / 7)} hete`;
  return date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
}

/* Count-up hook */
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function StatValue({ value, highlight }: { value: number; highlight?: boolean }) {
  const displayed = useCountUp(value);
  return (
    <span
      className={cn(
        "text-[28px] font-bold tracking-tight tabular-nums font-[var(--font-jetbrains)]",
        highlight ? "text-[#0ea5e9]" : "text-[#e2e8f0]"
      )}
    >
      {displayed}
    </span>
  );
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
          <h1 className="font-[var(--font-rajdhani)] font-bold text-2xl tracking-[0.04em] uppercase text-[#e2e8f0]">
            {businessName || "Dashboard"}
          </h1>
          <p className="text-sm text-[#64748b]">
            Munkák és járművek áttekintése
          </p>
        </div>
        <Link href="/jobs/new">
          <Button className="btn-gradient border-0 text-white font-semibold btn-press">
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
                "glass-card card-hover overflow-hidden animate-fade-in-up",
                `stagger-${i + 1}`
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#334155]">
                    {stat.label}
                  </p>
                  <Icon className="h-4 w-4 text-[#334155]" />
                </div>
                <StatValue value={stats[stat.key]} highlight={stat.highlight} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up stagger-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#334155]" />
        <Input
          placeholder="Keresés rendszám, márka, ECU típus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 bg-[#111620] border-[rgba(255,255,255,0.06)] focus-visible:ring-[rgba(14,165,233,0.2)] focus-visible:border-[rgba(14,165,233,0.3)] transition-all text-sm text-[#e2e8f0] placeholder:text-[#334155]"
        />
      </div>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <Card className="glass-card animate-fade-in-up stagger-6">
          <CardContent className="py-16 text-center">
            {jobs.length === 0 ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(14,165,233,0.08)]">
                  <Wrench className="h-7 w-7 text-[#0ea5e9]" />
                </div>
                <p className="font-[var(--font-rajdhani)] font-semibold text-lg tracking-[0.03em] uppercase text-[#64748b]">
                  Még nincs rögzített munka
                </p>
                <p className="text-sm text-[#334155]">
                  Rögzítsd az első munkát a kezdéshez!
                </p>
                <Link href="/jobs/new">
                  <Button className="btn-gradient border-0 text-white mt-2 btn-press">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Első munka rögzítése
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Search className="mx-auto h-8 w-8 text-[#334155]" />
                <p className="text-[#64748b]">Nincs találat a keresésre.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((job, i) => {
            const sc = statusConfig[job.status] ?? statusConfig.done;
            const hasPerformance = job.result_hp && job.vehicles.stock_hp;
            const hpDiff = hasPerformance ? job.result_hp! - job.vehicles.stock_hp! : 0;
            const hpPct = hasPerformance ? Math.round((hpDiff / job.vehicles.stock_hp!) * 100) : 0;

            return (
              <Link key={job.id} href={`/vehicles/${job.vehicle_id}`}>
                <Card
                  className={cn(
                    "glass-card card-hover cursor-pointer animate-fade-in-up",
                    `stagger-${Math.min(i + 1, 8)}`
                  )}
                >
                  <CardContent className="p-4 space-y-2.5">
                    {/* Row 1: Car name + plate */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Zap className="h-3.5 w-3.5 text-[#0ea5e9] shrink-0" />
                        <span className="font-[var(--font-rajdhani)] font-semibold text-[15px] tracking-[0.02em] uppercase text-[#e2e8f0] truncate">
                          {job.vehicles.brand} {job.vehicles.model}
                          {job.vehicles.engine ? ` ${job.vehicles.engine}` : ""}
                          {job.vehicles.stock_hp ? ` (${job.vehicles.stock_hp} LE)` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {job.vehicles.license_plate && (
                          <span className="font-[var(--font-jetbrains)] text-[11px] font-medium tracking-wider text-[#64748b] bg-[#161c28] border border-[rgba(255,255,255,0.06)] rounded-md px-2.5 py-0.5">
                            {job.vehicles.license_plate}
                          </span>
                        )}
                        {job.vehicles.year && (
                          <span className="text-[10px] text-[#334155]">{job.vehicles.year}</span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {job.job_types.map((type, ti) => (
                          <JobTypeBadge key={type} type={type} delay={ti * 50} />
                        ))}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                          sc.bg, sc.text
                        )}
                      >
                        <span className={cn("h-1 w-1 rounded-full", sc.dot)} />
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>

                    {/* Row 3: Performance — THE WOW FACTOR */}
                    {hasPerformance && (
                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="font-[var(--font-jetbrains)] text-[14px] tabular-nums text-[#64748b]">
                          {job.vehicles.stock_hp} LE
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#0ea5e9]" />
                        <span className="font-[var(--font-jetbrains)] text-[18px] font-bold tabular-nums text-[#06d6a0]">
                          {job.result_hp} LE
                        </span>
                        <span className="font-[var(--font-jetbrains)] text-[13px] font-semibold tabular-nums text-[#10b981] power-glow">
                          +{hpDiff} LE / +{hpPct}%
                        </span>
                        {job.result_nm && job.vehicles.stock_nm && (
                          <span className="font-[var(--font-jetbrains)] text-[11px] tabular-nums text-[#334155] ml-2">
                            {job.result_nm} Nm (+{job.result_nm - job.vehicles.stock_nm})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row 4: Info bar */}
                    <div className="flex items-center gap-4 pt-0.5 text-[11px] text-[#334155]">
                      {job.vehicles.ecu_type && (
                        <span className="inline-flex items-center gap-1 font-[var(--font-jetbrains)]">
                          <Cpu className="h-3 w-3" />
                          {job.vehicles.ecu_type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            (job.file_count ?? 0) > 0 ? "bg-[#10b981]" : "bg-[#334155]"
                          )}
                        />
                        <FolderOpen className="h-3 w-3" />
                        {(job.file_count ?? 0) > 0
                          ? `${job.file_count} fájl`
                          : "Nincs fájl"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatRelativeDate(job.job_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
