import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VehicleProfile } from "./vehicle-profile";
import { ShareSection } from "@/components/share-section";

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

  // Fetch existing share token
  const { data: shareToken } = await supabase
    .from("share_tokens")
    .select("id, token, view_count, is_active")
    .eq("vehicle_id", id)
    .eq("is_active", true)
    .single();

  return (
    <>
      <VehicleProfile
        vehicle={vehicle}
        jobs={jobs || []}
        files={files || []}
      />
      <div className="px-4 md:px-6 pb-6 max-w-3xl mx-auto">
        <ShareSection
          vehicleId={id}
          existingToken={shareToken}
        />
      </div>
    </>
  );
}
