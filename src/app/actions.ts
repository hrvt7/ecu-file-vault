"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createVehicle(formData: {
  brand: string;
  model: string;
  year?: number;
  engine?: string;
  engine_code?: string;
  ecu_type?: string;
  license_plate?: string;
  stock_hp?: number;
  stock_nm?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      profile_id: user.id,
      ...formData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createJob(formData: {
  vehicle_id: string;
  job_types: string[];
  result_hp?: number;
  result_nm?: number;
  file_source?: string;
  notes?: string;
  status: string;
  warranty_months?: number;
  warranty_conditions?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      profile_id: user.id,
      ...formData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  return data;
}

export async function updateJob(
  jobId: string,
  formData: {
    job_types?: string[];
    result_hp?: number | null;
    result_nm?: number | null;
    file_source?: string | null;
    notes?: string | null;
    status?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update(formData)
    .eq("id", jobId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteJob(jobId: string, vehicleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${vehicleId}`);
}

export async function updateVehicle(
  vehicleId: string,
  formData: {
    brand?: string;
    model?: string;
    year?: number | null;
    engine?: string | null;
    engine_code?: string | null;
    ecu_type?: string | null;
    license_plate?: string | null;
    stock_hp?: number | null;
    stock_nm?: number | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update(formData)
    .eq("id", vehicleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/dashboard");
}

export async function deleteVehicle(vehicleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfile(formData: { business_name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { error } = await supabase
    .from("profiles")
    .update(formData)
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function getSignedUploadUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("ecu-files")
    .createSignedUploadUrl(path);

  if (error) throw new Error(error.message);
  return data;
}

export async function getSignedDownloadUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("ecu-files")
    .createSignedUrl(path, 3600);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function createFileRecord(formData: {
  job_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number;
  storage_path: string;
  file_category: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { data, error } = await supabase
    .from("files")
    .insert({ profile_id: user.id, ...formData })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFile(fileId: string, storagePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("ecu-files").remove([storagePath]);
  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);
}
