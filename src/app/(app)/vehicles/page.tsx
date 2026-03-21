import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, jobs(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Járművek</h1>
        <p className="text-sm text-muted-foreground">Az összes rögzített jármű</p>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Még nincs rögzített jármű. Hozz létre egyet az &quot;Új munka&quot; menüponton!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v: any) => (
            <Link key={v.id} href={`/vehicles/${v.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {v.brand} {v.model}
                    </span>
                    {v.year && (
                      <span className="text-xs text-muted-foreground">{v.year}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.license_plate && (
                      <Badge variant="secondary" className="font-mono text-[11px] tracking-wider">
                        {v.license_plate}
                      </Badge>
                    )}
                    {v.ecu_type && (
                      <Badge variant="outline" className="text-[11px] font-mono">
                        {v.ecu_type}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {v.engine && <span>{v.engine}</span>}
                    {v.stock_hp && <span>{v.stock_hp} LE</span>}
                    <span>{v.jobs?.[0]?.count ?? 0} munka</span>
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
