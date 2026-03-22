import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Car, PlusCircle, Cpu, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, jobs(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Járművek</h1>
          <p className="text-sm text-muted-foreground">Az összes rögzített jármű</p>
        </div>
        <Link href="/jobs/new">
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Új jármű
          </Button>
        </Link>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <Card className="glass-card animate-fade-in-up stagger-1">
          <CardContent className="py-16 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Car className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium">Adj hozzá az első járműved</p>
              <p className="text-sm text-muted-foreground">
                Hozz létre egy járművet az &quot;Új munka&quot; menüponton!
              </p>
              <Link href="/jobs/new">
                <Button className="btn-gradient border-0 text-white mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Első jármű hozzáadása
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v: any, i: number) => {
            const jobCount = v.jobs?.[0]?.count ?? 0;
            return (
              <Link key={v.id} href={`/vehicles/${v.id}`}>
                <Card
                  className={cn(
                    "glass-card card-hover cursor-pointer h-full animate-fade-in-up",
                    `stagger-${Math.min(i + 1, 6)}`
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* Brand avatar */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground text-sm font-semibold shrink-0">
                          {v.brand.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[15px] tracking-[-0.01em] leading-tight">
                            {v.brand} {v.model}
                          </p>
                          {v.engine && (
                            <p className="text-xs text-muted-foreground">{v.engine}</p>
                          )}
                        </div>
                      </div>
                      {v.year && (
                        <span className="text-[11px] font-medium text-muted-foreground bg-secondary/80 rounded px-1.5 py-0.5">
                          {v.year}
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {v.license_plate && (
                        <span className="inline-flex items-center rounded-md bg-secondary/80 border border-border/50 px-2 py-0.5 font-[var(--font-jetbrains)] text-[11px] font-medium tracking-wider text-muted-foreground">
                          {v.license_plate}
                        </span>
                      )}
                      {v.ecu_type && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 font-[var(--font-jetbrains)] text-[10px] text-muted-foreground/80">
                          <Cpu className="h-2.5 w-2.5" />
                          {v.ecu_type}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
                      <div className="flex items-center gap-3">
                        {v.stock_hp && (
                          <span className="font-[var(--font-jetbrains)] tabular-nums">
                            {v.stock_hp} LE
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {jobCount} munka
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
