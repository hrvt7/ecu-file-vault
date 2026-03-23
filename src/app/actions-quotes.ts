"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PriceListItem, Quote, QuoteItem } from "@/lib/types";

// ─── Price List ───────────────────────────────────────────────────────────────

export async function getPriceList(): Promise<PriceListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data, error } = await supabase
    .from("price_list")
    .select("*")
    .eq("profile_id", user.id)
    .order("brand", { ascending: true })
    .order("stage", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addPriceItem(data: {
  brand: string;
  engine_pattern: string;
  stage: string;
  price_net: number;
  price_note?: string;
}): Promise<PriceListItem> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data: item, error } = await supabase
    .from("price_list")
    .insert({ profile_id: user.id, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  return item;
}

export async function deletePriceItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("price_list").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function seedDefaultPrices(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  // Only seed if the price list is empty
  const { count } = await supabase
    .from("price_list")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  if ((count ?? 0) > 0) return;

  const defaults = [
    { brand: "BMW", engine_pattern: "2.0d", stage: "Stage 1", price_net: 35000, price_note: "B47 / N47" },
    { brand: "BMW", engine_pattern: "3.0d", stage: "Stage 1", price_net: 40000, price_note: "B57 / N57" },
    { brand: "BMW", engine_pattern: "2.0d", stage: "Stage 2", price_net: 55000, price_note: "B47 / N47" },
    { brand: "Volkswagen", engine_pattern: "2.0 TDI", stage: "Stage 1", price_net: 32000, price_note: "EA288" },
    { brand: "Volkswagen", engine_pattern: "2.0 TDI", stage: "Stage 2", price_net: 50000, price_note: "EA288" },
    { brand: "Audi", engine_pattern: "3.0 TDI", stage: "Stage 1", price_net: 45000, price_note: "V6 TDI" },
    { brand: "Mercedes", engine_pattern: "2.2 CDI", stage: "Stage 1", price_net: 38000, price_note: "OM651" },
    { brand: "Ford", engine_pattern: "2.0 TDCi", stage: "Stage 1", price_net: 30000, price_note: "" },
    { brand: "Opel", engine_pattern: "2.0 CDTI", stage: "Stage 1", price_net: 28000, price_note: "" },
    { brand: "Renault", engine_pattern: "1.5 dCi", stage: "Stage 1", price_net: 25000, price_note: "K9K" },
    { brand: "Peugeot", engine_pattern: "2.0 HDi", stage: "Stage 1", price_net: 28000, price_note: "DW10" },
    { brand: "Volkswagen", engine_pattern: "Bármely", stage: "DPF off", price_net: 20000, price_note: null },
    { brand: "Bármely", engine_pattern: "Bármely", stage: "EGR off", price_net: 15000, price_note: null },
    { brand: "Bármely", engine_pattern: "Bármely", stage: "AdBlue off", price_net: 18000, price_note: null },
    { brand: "Bármely", engine_pattern: "Bármely", stage: "DTC off", price_net: 10000, price_note: null },
  ];

  const rows = defaults.map((d) => ({ profile_id: user.id, ...d }));
  const { error } = await supabase.from("price_list").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createQuote(data: {
  vehicle_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  car_description: string;
  items: QuoteItem[];
  total_net: number;
  total_gross: number;
  vat_percent: number;
  valid_until?: string | null;
  notes?: string | null;
}): Promise<Quote> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      profile_id: user.id,
      status: "draft",
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/quotes");
  return quote;
}

export async function updateQuoteStatus(
  id: string,
  status: Quote["status"]
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/quotes");
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/quotes");
}
