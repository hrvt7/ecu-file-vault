import { createClient } from "@supabase/supabase-js";

// Admin client bypasses RLS — use only in server-side API routes
// for public endpoints where there's no auth context.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // Fallback to anon key if service role not set — queries will be
    // limited by RLS (public endpoints won't work fully until
    // SUPABASE_SERVICE_ROLE_KEY is configured).
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}
