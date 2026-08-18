import { createClient } from "@supabase/supabase-js"

const globalForSb = globalThis as unknown as {
  supabaseAdmin?: ReturnType<typeof createClient>
}

export const supabaseAdmin =
  globalForSb.supabaseAdmin ??
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

if (process.env.NODE_ENV !== "production") globalForSb.supabaseAdmin = supabaseAdmin
