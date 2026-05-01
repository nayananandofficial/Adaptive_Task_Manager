import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Card = Database['public']['Tables']['cards']['Row']
type CardInsert = Database['public']['Tables']['cards']['Insert']

export async function getCards(list_id: string): Promise<Card[]> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('list_id', list_id)
    .order('position', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createCard(list_id: string, title: string): Promise<Card> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const insertPayload: CardInsert = {
    list_id,
    title
  }

  const { data, error } = await supabase
    .from('cards')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createCardWithOptions(
  list_id: string,
  title: string,
  options?: Partial<Pick<Card, 'description' | 'due_date' | 'position' | 'labels'>>
): Promise<Card> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const insertPayload: CardInsert = {
    list_id,
    title,
    description: options?.description,
    due_date: options?.due_date,
    position: options?.position,
    labels: options?.labels
  }

  const { data, error } = await supabase
    .from('cards')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateCard(
  cardId: string,
  updates: Partial<Pick<Card, 'title' | 'description' | 'due_date' | 'position' | 'labels' | 'list_id'>>
): Promise<Card> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', cardId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteCard(cardId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)

  if (error) {
    throw error
  }
}

export async function updateCardsPositions(
  updates: Array<Pick<Card, 'id' | 'list_id' | 'position'>>
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  if (updates.length === 0) return

  for (const { id, list_id, position } of updates) {
    const { error } = await supabase
      .from('cards')
      .update({ list_id, position })
      .eq('id', id)

    if (error) {
      throw error
    }
  }
}


