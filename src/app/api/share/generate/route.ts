import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vehicleId } = await request.json();
    if (!vehicleId) {
      return NextResponse.json(
        { error: "vehicleId is required" },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("profile_id", user.id)
      .single();

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Check for existing active token
    const { data: existingToken } = await supabase
      .from("share_tokens")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("is_active", true)
      .single();

    if (existingToken) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000";
      return NextResponse.json({
        token: existingToken.token,
        tokenId: existingToken.id,
        url: `${appUrl}/share/${existingToken.token}`,
        viewCount: existingToken.view_count,
        isNew: false,
      });
    }

    // Generate new token
    const { data: newToken, error } = await supabase
      .from("share_tokens")
      .insert({
        vehicle_id: vehicleId,
        profile_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    return NextResponse.json({
      token: newToken.token,
      tokenId: newToken.id,
      url: `${appUrl}/share/${newToken.token}`,
      viewCount: 0,
      isNew: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
