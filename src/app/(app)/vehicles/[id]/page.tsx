import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VehicleProfile } from "./vehicle-profile";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers(name)")
    .eq("id", id)
    .single();

  if (!vehicle) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("vehicle_id", id)
    .order("job_date", { ascending: false });

  // Fetch files for all jobs
  const jobIds = (jobs || []).map((j: any) => j.id);
  const { data: files } = jobIds.length > 0
    ? await supabase
        .from("files")
        .select("*")
        .in("job_id", jobIds)
    : { data: [] };

  return (
    <VehicleProfile
      vehicle={vehicle}
      jobs={jobs || []}
      files={files || []}
    />
  );
}
