import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type List = Database['public']['Tables']['lists']['Row']
type ListInsert = Database['public']['Tables']['lists']['Insert']

export async function getLists(board_id: string): Promise<List[]> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', board_id)
    .order('position', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createList(board_id: string, title: string): Promise<List> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const insertPayload: ListInsert = {
    board_id,
    title
  }

  const { data, error } = await supabase
    .from('lists')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

