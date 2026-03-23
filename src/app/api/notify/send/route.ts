import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, customerName, carDescription, shareUrl, businessName } =
      await request.json();

    if (!to) {
      return NextResponse.json({ error: "Nincs email cím" }, { status: 400 });
    }

    // Check if Resend API key is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      // Fallback: log the email (Resend not configured yet)
      console.log("Email would be sent to:", to, { customerName, carDescription, shareUrl });
      return NextResponse.json({
        success: true,
        message: "Email logged (Resend not configured)",
      });
    }

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${businessName} <noreply@resend.dev>`,
        to: [to],
        subject: `Az autód kész! — ${businessName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
            <h1 style="color: #0ea5e9; font-size: 24px; margin-bottom: 8px;">${businessName}</h1>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Tuning értesítés</p>

            <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
              <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">
                Kedves ${customerName || "Ügyfelünk"}!
              </p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">
                Az autód (<strong>${carDescription}</strong>) elkészült!
              </p>
              ${shareUrl ? `
                <div style="margin: 24px 0; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                  <p style="font-size: 14px; color: #0369a1; margin-bottom: 8px;">Az eredményeket itt tekintheted meg:</p>
                  <a href="${shareUrl}" style="color: #0ea5e9; font-size: 14px; word-break: break-all;">${shareUrl}</a>
                </div>
              ` : ""}
              <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
                Kérdés esetén keress minket bátran!
              </p>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
              ${businessName} · Powered by ECU File Vault
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.message || "Email küldés sikertelen" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Szerverhiba" },
      { status: 500 }
    );
  }
}
