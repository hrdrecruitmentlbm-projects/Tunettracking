import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMockSupabaseClient } from "./supabase-mock";

/**
 * Service-role Supabase client for server-side operations only.
 * Bypasses RLS. Must never be imported by client components.
 */
function initSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!/^https?:\/\//i.test(supabaseUrl) || !serviceRoleKey) {
    return createMockSupabaseClient();
  }

  try {
    return createClient(supabaseUrl, serviceRoleKey);
  } catch {
    return createMockSupabaseClient();
  }
}

export const supabaseAdmin = initSupabaseAdmin();
