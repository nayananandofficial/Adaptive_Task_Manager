import type { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { createBoardWithOptions } from './boardService'
import { createListWithOptions } from './listService'
import { createCardWithOptions } from './cardService'
import { getTemplateById, templatesByRole, type BoardTemplateDefinition } from '../data/roleTemplates'

type Board = Database['public']['Tables']['boards']['Row']
type UserRole = Database['public']['Tables']['users']['Row']['role']

export function getTemplatesForRole(role: UserRole): BoardTemplateDefinition[] {
  return templatesByRole[role]
}

export async function applyBoardTemplate(templateId: string, userId: string): Promise<Board> {
  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error('Template not found')
  }

  let ownerId = userId
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true'
  if (supabase && !bypassAuth) {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      ownerId = userId
    } else if (data.user?.id) {
      ownerId = data.user.id
    }
  }

  const board = await createBoardWithOptions(template.board.title, ownerId, {
    description: template.board.description,
    color: template.board.color
  })

  for (let listIndex = 0; listIndex < template.lists.length; listIndex += 1) {
    const listDefinition = template.lists[listIndex]
    const createdList = await createListWithOptions(board.id, listDefinition.title, {
      position: listIndex
    })

    if (!listDefinition.cards?.length) continue

    for (let cardIndex = 0; cardIndex < listDefinition.cards.length; cardIndex += 1) {
      const cardDefinition = listDefinition.cards[cardIndex]
      await createCardWithOptions(createdList.id, cardDefinition.title, {
        position: cardIndex,
        description: cardDefinition.description,
        labels: cardDefinition.labels
      })
    }
  }

  return board
}
