import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Board = Database['public']['Tables']['boards']['Row']
type BoardInsert = Database['public']['Tables']['boards']['Insert']

export async function getBoards(user_id: string): Promise<Board[]> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user_id)
    .order('position', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

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

export async function deleteBoard(boardId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)

  if (error) {
    throw error
  }
}

export async function updateBoard(boardId: string, updates: Partial<Pick<Board, 'title' | 'color' | 'position'>>): Promise<Board> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

//service currently returns raw database rows.
//Later I might want to add a type guard or transformation layer, but that is optional for now.