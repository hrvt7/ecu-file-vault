"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Appointment } from "@/lib/types";

type AppointmentInsert = {
  customer_name: string;
  customer_phone?: string | null;
  vehicle_id?: string | null;
  date: string;
  time_slot: string;
  service_type?: string | null;
  notes?: string | null;
  status?: Appointment["status"];
};

type AppointmentUpdate = Partial<AppointmentInsert>;

export async function createAppointment(data: AppointmentInsert) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data: record, error } = await supabase
    .from("appointments")
    .insert({
      profile_id: user.id,
      status: "confirmed",
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return record as Appointment;
}

export async function updateAppointment(id: string, data: AppointmentUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { error } = await supabase
    .from("appointments")
    .update(data)
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function getTodayAppointments(): Promise<Appointment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("profile_id", user.id)
    .eq("date", today)
    .order("time_slot", { ascending: true });

  if (error) return [];
  return (data ?? []) as Appointment[];
}
