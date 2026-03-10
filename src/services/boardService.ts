import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Board = Database['public']['Tables']['boards']['Row']
type BoardInsert = Database['public']['Tables']['boards']['Insert']

export async function createBoard(title: string, user_id: string): Promise<Board> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const insertPayload: BoardInsert = {
    title,
    user_id
  }

  const { data, error } = await supabase
    .from('boards')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}
