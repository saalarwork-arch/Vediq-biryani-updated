import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl =
  !rawUrl || rawUrl.includes('iqgwzfeprwoanjdnvkog') || rawUrl.includes('placeholder')
    ? 'https://vjfoacxdihwseoeorohg.supabase.co'
    : rawUrl;

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const rawAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

const supabaseServiceKey =
  rawServiceKey && !rawServiceKey.includes('iqgwzfeprwoanjdnvkog')
    ? rawServiceKey
    : !rawAnonKey || rawAnonKey.includes('oCpYwd') || rawAnonKey.includes('placeholder')
    ? 'sb_publishable_iQefxX2GY7_1hA5ylJwybQ_AhQEVvNH'
    : rawAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
