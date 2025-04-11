import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for the server
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Client singleton to avoid multiple instances
let clientSingleton: ReturnType<typeof createClientSupabaseClient> | null =
  null;

// Create a supabase client for the browser
export const createClientSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Get the client singleton
export const getClientSupabaseClient = () => {
  if (!clientSingleton) {
    clientSingleton = createClientSupabaseClient();
  }
  return clientSingleton;
};
