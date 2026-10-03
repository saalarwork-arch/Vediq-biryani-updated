import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl =
  !rawUrl || rawUrl.includes('iqgwzfeprwoanjdnvkog') || rawUrl.includes('placeholder')
    ? 'https://vjfoacxdihwseoeorohg.supabase.co'
    : rawUrl;

const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

const supabaseAnonKey =
  !rawKey || rawKey.includes('oCpYwd') || rawKey.includes('placeholder')
    ? 'sb_publishable_iQefxX2GY7_1hA5ylJwybQ_AhQEVvNH'
    : rawKey;

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('placeholder-project')
  );
};
