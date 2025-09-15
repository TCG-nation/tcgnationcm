import { createClient, type SupabaseClient } from '@supabase/supabase-js'
let supabaseBrowser: SupabaseClient | null = null
export const supabase =
  typeof window !== 'undefined'
    ? (supabaseBrowser ?? (supabaseBrowser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )))
    : (null as unknown as SupabaseClient)
