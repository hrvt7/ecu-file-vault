import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, brand, model, license_plate, ecu_type, stock_hp, stock_nm")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Új munka rögzítése</h1>
        <p className="text-sm text-muted-foreground">Válassz járművet, add meg a munka adatait</p>
      </div>
      <NewJobForm vehicles={vehicles || []} userId={user.id} />
    </div>
  );
}
