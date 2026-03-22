import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Lookup token
    const { data: shareToken, error } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !shareToken) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Check active + not expired
    if (!shareToken.is_active) {
      return NextResponse.json({ error: "revoked" }, { status: 410 });
    }
    if (
      shareToken.expires_at &&
      new Date(shareToken.expires_at) < new Date()
    ) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    // Increment view count
    await supabase
      .from("share_tokens")
      .update({ view_count: (shareToken.view_count ?? 0) + 1 })
      .eq("id", shareToken.id);

    // Get vehicle data
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, brand, model, year, engine, engine_code, ecu_type, license_plate, stock_hp, stock_nm")
      .eq("id", shareToken.vehicle_id)
      .single();

    if (!vehicle) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Get jobs (without internal notes)
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, job_date, job_types, result_hp, result_nm, file_source, status")
      .eq("vehicle_id", vehicle.id)
      .eq("profile_id", shareToken.profile_id)
      .order("job_date", { ascending: false });

    // Get ONLY dyno report files (not original/modified ECU files)
    const jobIds = (jobs || []).map((j) => j.id);
    let files: any[] = [];
    if (jobIds.length > 0) {
      const { data: dynoFiles } = await supabase
        .from("files")
        .select("id, job_id, file_name, file_size, file_category")
        .in("job_id", jobIds)
        .eq("file_category", "dyno_report");
      files = dynoFiles || [];
    }

    // Get business name
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", shareToken.profile_id)
      .single();

    return NextResponse.json({
      vehicle,
      jobs: jobs || [],
      files,
      business: { name: profile?.business_name ?? "Chiptuning műhely" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
