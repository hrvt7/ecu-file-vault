import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
import { PriceListTab } from "./price-list-tab";
import { getPriceList } from "@/app/actions-quotes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const priceList = await getPriceList();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-[var(--font-heading)] text-2xl font-semibold tracking-[0.04em] uppercase text-[#e2e8f0]">
          Beállítások
        </h1>
        <p className="text-sm text-[#64748b]">Fiók és műhely beállítások</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="prices">Árak</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <SettingsForm
            email={user.email ?? ""}
            businessName={profile?.business_name ?? ""}
          />
        </TabsContent>

        <TabsContent value="prices" className="mt-6">
          <PriceListTab initialItems={priceList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
