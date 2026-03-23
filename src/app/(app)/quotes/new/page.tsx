import { createClient } from "@/lib/supabase/server";
import { getPriceList } from "@/app/actions-quotes";
import { NewQuoteForm } from "./new-quote-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: vehicles }, priceList] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("profile_id", user.id)
      .order("brand", { ascending: true }),
    getPriceList(),
  ]);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="animate-fade-in-up mb-6">
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1 text-xs text-[#64748b] hover:text-[#94a3b8] mb-3 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Vissza az ajánlatokhoz
        </Link>
        <h1 className="font-[var(--font-heading)] text-2xl font-semibold tracking-[0.04em] uppercase text-[#e2e8f0]">
          Új árajánlat
        </h1>
        <p className="text-sm text-[#64748b]">Az ajánlat piszkozatként kerül mentésre.</p>
      </div>

      <NewQuoteForm
        vehicles={(vehicles as Vehicle[]) ?? []}
        priceList={priceList}
      />
    </div>
  );
}
