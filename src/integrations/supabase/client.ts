import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';
import { standaloneSupabase } from './standaloneClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isStandaloneMode =
  import.meta.env.VITE_STANDALONE === "true" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("standalone") === "true");

const realClient = (!isStandaloneMode && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: brokeredPreviewStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  : null;

export const supabase: any = isStandaloneMode ? standaloneSupabase : (realClient || standaloneSupabase);
