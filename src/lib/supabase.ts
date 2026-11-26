import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMockSupabaseClient } from "./supabase-mock";

function initSupabase(): SupabaseClient {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!/^https?:\/\//i.test(supabaseUrl) || !supabaseAnonKey) {
    return createMockSupabaseClient();
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return createMockSupabaseClient();
  }
}

export const supabase = initSupabase();
