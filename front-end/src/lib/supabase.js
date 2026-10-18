import { createClient } from '@supabase/supabase-js'

// Only the publishable key lives in the client; Row Level Security does the gatekeeping.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
