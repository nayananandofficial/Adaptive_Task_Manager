import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Subtask = Database['public']['Tables']['subtasks']['Row']
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']

export async function getSubtasks(card_id: string): Promise<Subtask[]> {
    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }
  
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('card_id', card_id)
      .order('position', { ascending: true })
  
    if (error) {
      throw error
    }
  
    return data
  }

  export async function createSubtask(
    card_id: string,
    title: string
  ): Promise<Subtask> {
    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }
  
    const payload: SubtaskInsert = {
      card_id,
      title
    }
  
    const { data, error } = await supabase
      .from('subtasks')
      .insert(payload)
      .select('*')
      .single()
  
    if (error) {
      throw error
    }
  
    return data
  }

  export async function updateSubtask(
    subtaskId: string,
    updates: Partial<Pick<Subtask, 'title' | 'completed' | 'position'>>
  ): Promise<Subtask> {
    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }

    const { data, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', subtaskId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  export async function deleteSubtask(subtaskId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId)

    if (error) {
      throw error
    }
  }