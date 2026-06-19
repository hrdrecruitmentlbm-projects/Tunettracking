import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Service-role Supabase client for server-side operations only.
 * Bypasses RLS. Must never be imported by client components.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
