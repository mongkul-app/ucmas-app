import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True once both env vars are present. The app falls back to local-only mode
 * (no login, no cross-device sync) when they're missing, so a missing
 * Supabase setup never breaks the app — it just runs offline-only.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // The app uses HashRouter (URLs like /#/dashboard). Supabase's default
        // OAuth flow returns the session in a URL *hash* fragment too, which
        // would collide with HashRouter's own routing. PKCE returns it as a
        // query param (?code=...) instead, so the two don't clash.
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
