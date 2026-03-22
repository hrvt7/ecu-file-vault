import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ token: string; fileId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { token, fileId } = await params;
    const supabase = createAdminClient();

    // Validate token
    const { data: shareToken } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (!shareToken || !shareToken.is_active) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    if (
      shareToken.expires_at &&
      new Date(shareToken.expires_at) < new Date()
    ) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 });
    }

    // Get the file — ONLY dyno_report category allowed
    const { data: file } = await supabase
      .from("files")
      .select("*, jobs!inner(vehicle_id)")
      .eq("id", fileId)
      .eq("file_category", "dyno_report")
      .single();

    if (!file) {
      return NextResponse.json(
        { error: "File not found or not downloadable" },
        { status: 404 }
      );
    }

    // Verify file belongs to the shared vehicle
    if (file.jobs.vehicle_id !== shareToken.vehicle_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate signed URL (5 min)
    const { data: signedUrlData, error } = await supabase.storage
      .from("ecu-files")
      .createSignedUrl(file.storage_path, 300);

    if (error || !signedUrlData) {
      return NextResponse.json(
        { error: "Could not generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
