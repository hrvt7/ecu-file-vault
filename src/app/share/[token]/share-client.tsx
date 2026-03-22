"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Award, Calendar, Cpu, Gauge, AlertTriangle } from "lucide-react";

interface Vehicle {
  brand: string;
  model: string;
  year: number | null;
  engine: string | null;
  engine_code: string | null;
  ecu_type: string | null;
  license_plate: string | null;
  stock_hp: number | null;
  stock_nm: number | null;
}

interface Job {
  id: string;
  job_date: string;
  job_types: string[];
  result_hp: number | null;
  result_nm: number | null;
  status: string;
}

interface ShareFile {
  id: string;
  job_id: string;
  file_name: string;
  file_size: number | null;
}

interface ShareData {
  vehicle: Vehicle;
  jobs: Job[];
  files: ShareFile[];
  business: { name: string };
}

const typeBadgeColors: Record<string, string> = {
  "Stage 1": "bg-blue-100 text-blue-700",
  "Stage 2": "bg-amber-100 text-amber-700",
  "Stage 3": "bg-orange-100 text-orange-700",
  "DPF off": "bg-red-100 text-red-700",
  "EGR off": "bg-pink-100 text-pink-700",
  "AdBlue off": "bg-purple-100 text-purple-700",
  "DTC off": "bg-cyan-100 text-cyan-700",
  "TCU tune": "bg-emerald-100 text-emerald-700",
  "Egyéb": "bg-gray-100 text-gray-700",
};

export function SharePageClient({
  data,
  error,
  token,
}: {
  data: ShareData | null;
  error: string | null;
  token: string;
}) {
  if (error === "expired" || error === "not_found") {
    return <ExpiredPage businessName={null} isExpired={error === "expired"} />;
  }

  if (!data) {
    return <ExpiredPage businessName={null} isExpired={false} />;
  }

  const { vehicle, jobs, files, business } = data;
  const filesByJob = new Map<string, ShareFile[]>();
  files.forEach((f) => {
    const existing = filesByJob.get(f.job_id) || [];
    existing.push(f);
    filesByJob.set(f.job_id, existing);
  });

  // Get the best result for hero section
  const latestJobWithHp = jobs.find((j) => j.result_hp);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{business.name}</p>
              <p className="text-[11px] text-gray-500">Tuning tanúsítvány</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Award className="h-4 w-4" />
            <span className="text-[11px] font-medium">Hitelesített</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle hero */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.year && (
                <p className="text-gray-500 text-sm">{vehicle.year}</p>
              )}
            </div>
            {vehicle.license_plate && (
              <span className="inline-flex items-center rounded-lg bg-gray-100 border border-gray-200 px-3 py-1 font-mono text-sm font-semibold tracking-wider text-gray-700">
                {vehicle.license_plate}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {vehicle.engine && (
              <InfoPill label="Motor" value={vehicle.engine} />
            )}
            {vehicle.engine_code && (
              <InfoPill label="Motorkód" value={vehicle.engine_code} mono />
            )}
            {vehicle.ecu_type && (
              <InfoPill label="ECU" value={vehicle.ecu_type} mono icon={<Cpu className="h-3 w-3 text-gray-400" />} />
            )}
          </div>
        </div>

        {/* Power comparison hero */}
        {latestJobWithHp && vehicle.stock_hp && (
          <PowerComparison
            stockHp={vehicle.stock_hp}
            stockNm={vehicle.stock_nm}
            resultHp={latestJobWithHp.result_hp!}
            resultNm={latestJobWithHp.result_nm}
          />
        )}

        {/* Jobs timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            Tuning történet
          </h2>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
              Még nincs rögzített munka
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const jobFiles = filesByJob.get(job.id) || [];
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {job.job_types.map((type) => (
                          <span
                            key={type}
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${typeBadgeColors[type] ?? typeBadgeColors["Egyéb"]}`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(job.job_date).toLocaleDateString("hu-HU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {(job.result_hp || job.result_nm) && (
                      <div className="flex items-center gap-4 text-sm">
                        {job.result_hp && (
                          <span className="font-mono tabular-nums">
                            <span className="text-gray-500">
                              {vehicle.stock_hp ?? "?"} →
                            </span>{" "}
                            <span className="font-semibold text-blue-600">
                              {job.result_hp} LE
                            </span>
                            {vehicle.stock_hp && (
                              <span className="ml-1 text-emerald-600 font-semibold text-xs">
                                +{job.result_hp - vehicle.stock_hp}
                              </span>
                            )}
                          </span>
                        )}
                        {job.result_nm && (
                          <span className="font-mono tabular-nums text-gray-500">
                            {job.result_nm} Nm
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dyno report downloads */}
                    {jobFiles.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        {jobFiles.map((file) => (
                          <a
                            key={file.id}
                            href={`/api/share/${token}/download/${file.id}`}
                            className="flex items-center gap-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 text-blue-700 text-sm font-medium transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span className="flex-1">{file.file_name}</span>
                            {file.file_size && (
                              <span className="text-[11px] text-blue-400">
                                {(file.file_size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12 py-6 px-4 text-center">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-500 hover:underline"
          >
            ECU File Vault
          </a>{" "}
          — Chiptuning fájl- és munkanyilvántartó rendszer
        </p>
      </footer>
    </div>
  );
}

/* Power comparison with animated bars */
function PowerComparison({
  stockHp,
  stockNm,
  resultHp,
  resultNm,
}: {
  stockHp: number;
  stockNm: number | null;
  resultHp: number;
  resultNm: number | null;
}) {
  const diffHp = resultHp - stockHp;
  const pctHp = Math.round((diffHp / stockHp) * 100);
  const maxHp = resultHp * 1.1;

  const diffNm =
    stockNm && resultNm ? resultNm - stockNm : null;
  const pctNm =
    stockNm && resultNm
      ? Math.round((diffNm! / stockNm) * 100)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-lg">Teljesítmény</h2>
      </div>

      {/* HP bars */}
      <div className="space-y-3">
        <PowerBar
          label="Gyári"
          value={stockHp}
          unit="LE"
          max={maxHp}
          color="bg-gray-300"
          textColor="text-gray-600"
        />
        <PowerBar
          label="Tuning után"
          value={resultHp}
          unit="LE"
          max={maxHp}
          color="bg-gradient-to-r from-blue-500 to-cyan-400"
          textColor="text-blue-700"
          badge={`+${diffHp} LE (+${pctHp}%)`}
        />
      </div>

      {/* Nm bars */}
      {stockNm && resultNm && diffNm !== null && (
        <>
          <div className="border-t border-gray-100" />
          <div className="space-y-3">
            <PowerBar
              label="Gyári"
              value={stockNm}
              unit="Nm"
              max={resultNm * 1.1}
              color="bg-gray-300"
              textColor="text-gray-600"
            />
            <PowerBar
              label="Tuning után"
              value={resultNm}
              unit="Nm"
              max={resultNm * 1.1}
              color="bg-gradient-to-r from-emerald-500 to-teal-400"
              textColor="text-emerald-700"
              badge={`+${diffNm} Nm (+${pctNm}%)`}
            />
          </div>
        </>
      )}
    </div>
  );
}

function PowerBar({
  label,
  value,
  unit,
  max,
  color,
  textColor,
  badge,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  textColor: string;
  badge?: string;
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 100);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const pct = Math.round((value / max) * 100);

  return (
    <div ref={ref} className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-semibold tabular-nums ${textColor}`}>
            {value} {unit}
          </span>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-[800ms] ease-out ${color}`}
          style={{ width: animated ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function InfoPill({
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
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-medium flex items-center gap-1 ${mono ? "font-mono" : ""}`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function ExpiredPage({
  businessName,
  isExpired,
}: {
  businessName: string | null;
  isExpired: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {isExpired ? "Ez a link lejárt" : "Link nem található"}
        </h1>
        <p className="text-gray-500 text-sm">
          {isExpired
            ? "A megosztási link érvényessége lejárt. Kérdezd meg a műhelyt egy új linkért!"
            : "Ez a link nem létezik vagy visszavonásra került."}
        </p>
        {businessName && (
          <p className="text-xs text-gray-400">Műhely: {businessName}</p>
        )}
      </div>
    </div>
  );
}
