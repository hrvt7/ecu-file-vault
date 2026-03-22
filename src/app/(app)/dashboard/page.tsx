import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";
import type { JobWithVehicle } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  // Fetch jobs with vehicle data
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, vehicles(*)")
    .order("job_date", { ascending: false })
    .limit(100);

  // Fetch file counts per job
  const { data: fileCounts } = await supabase
    .from("files")
    .select("job_id");

  const fileCountMap = new Map<string, number>();
  fileCounts?.forEach((f: { job_id: string }) => {
    fileCountMap.set(f.job_id, (fileCountMap.get(f.job_id) || 0) + 1);
  });

  const jobsWithFiles: JobWithVehicle[] = (jobs || []).map((job: JobWithVehicle) => ({
    ...job,
    file_count: fileCountMap.get(job.id) || 0,
  }));

  // Stats
  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true });

  const { count: totalVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  const { count: totalFiles } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true });

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const { count: monthJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .gte("job_date", firstOfMonth.toISOString().split("T")[0]);

  const { count: sharedVehicles } = await supabase
    .from("share_tokens")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", user.user.id)
    .single();

  return (
    <DashboardClient
      jobs={jobsWithFiles}
      stats={{
        totalJobs: totalJobs ?? 0,
        totalVehicles: totalVehicles ?? 0,
        totalFiles: totalFiles ?? 0,
        monthJobs: monthJobs ?? 0,
        sharedVehicles: sharedVehicles ?? 0,
      }}
      businessName={profile?.business_name ?? ""}
    />
  );
}
