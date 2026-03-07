import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only throw error if not bypassing auth
if ((!supabaseUrl || !supabaseAnonKey) && import.meta.env.VITE_BYPASS_AUTH !== 'true') {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null
