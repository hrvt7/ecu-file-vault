import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beállítások</h1>
        <p className="text-sm text-muted-foreground">Fiók és műhely beállítások</p>
      </div>
      <SettingsForm
        email={user.email ?? ""}
        businessName={profile?.business_name ?? ""}
      />
    </div>
  );
}
