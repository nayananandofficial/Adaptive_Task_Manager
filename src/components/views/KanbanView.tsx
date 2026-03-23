import { useApp } from '../../contexts/AppContext'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createList, deleteList, updateList } from '../../services/listService'
import { createCard, deleteCard, updateCard, updateCardsPositions } from '../../services/cardService'
import { SortableCard } from '../cards/SortableCard'

export function KanbanView() {
  const { state, dispatch } = useApp()

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over) return
    if (active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeCard = state.cards.find((c) => c.id === activeId)
    const overCard = state.cards.find((c) => c.id === overId)
    if (!activeCard || !overCard) return

    // Same list: reorder
    if (activeCard.list_id === overCard.list_id) {
      const listId = activeCard.list_id
      const listCards = state.cards
        .filter((c) => c.list_id === listId)
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

      const oldIndex = listCards.findIndex((c) => c.id === activeId)
      const newIndex = listCards.findIndex((c) => c.id === overId)
      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = arrayMove(listCards, oldIndex, newIndex).map((c) => c.id)
      dispatch({ type: 'REORDER_CARDS_IN_LIST', payload: { listId, cardIds: newOrder } })
      void (async () => {
        try {
          await updateCardsPositions(
            newOrder.map((id, index) => ({
              id,
              list_id: listId,
              position: index
            }))
          )
        } catch (error) {
          console.error('Failed to persist card order:', error)
        }
      })()
      return
    }

    // Cross list: remove from source, insert into destination (relative to "over" card)
    const fromListId = activeCard.list_id
    const toListId = overCard.list_id

    const fromCards = state.cards
      .filter((c) => c.list_id === fromListId)
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((c) => c.id)
      .filter((id) => id !== activeId)

    const toCards = state.cards
      .filter((c) => c.list_id === toListId)
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((c) => c.id)

    const insertIndex = Math.max(0, toCards.indexOf(overId))
    const nextToCards = toCards.slice()
    nextToCards.splice(insertIndex, 0, activeId)

    const payload = {
        type: 'MOVE_CARD',
      payload: { cardId: activeId, fromListId, toListId, fromCardIds: fromCards, toCardIds: nextToCards }
    } as const

    dispatch(payload)

    void (async () => {
      try {
        await updateCardsPositions([
          ...fromCards.map((id, index) => ({
            id,
            list_id: fromListId,
            position: index
          })),
          ...nextToCards.map((id, index) => ({
            id,
            list_id: toListId,
            position: index
          }))
        ])
      } catch (error) {
        console.error('Failed to persist cross-list move:', error)
      }
    })()
  }

  const handleCreateList = (): void => {
    const boardId = state.currentBoard?.id
    if (!boardId) {
      window.alert('Select a board first.')
      return
    }

    const titleInput = window.prompt('List title')
    if (titleInput === null) return

    const title = titleInput.trim()
    if (!title) return

    void (async () => {
      try {
        const list = await createList(boardId, title)
        dispatch({ type: 'ADD_LIST', payload: list })
      } catch (error) {
        console.error('Failed to create list:', error)
        window.alert('Could not create list. Please try again.')
      }
    })()
  }

  const handleRenameList = (listId: string, currentTitle: string): void => {
    const titleInput = window.prompt('Rename list', currentTitle)
    if (titleInput === null) return

    const title = titleInput.trim()
    if (!title || title === currentTitle) return

    void (async () => {
      try {
        const updated = await updateList(listId, { title })
        dispatch({ type: 'UPDATE_LIST', payload: updated })
      } catch (error) {
        console.error('Failed to rename list:', error)
        window.alert('Could not rename list. Please try again.')
      }
    })()
  }

  const handleDeleteList = (listId: string, title: string): void => {
    const confirmed = window.confirm(`Delete list "${title}"? This will also remove its cards.`)
    if (!confirmed) return

    void (async () => {
      try {
        await deleteList(listId)
        dispatch({ type: 'DELETE_LIST', payload: listId })
      } catch (error) {
        console.error('Failed to delete list:', error)
        window.alert('Could not delete list. Please try again.')
      }
    })()
  }

  const handleCreateCard = (listId: string): void => {
    const titleInput = window.prompt('Card title')
    if (titleInput === null) return

    const title = titleInput.trim()
    if (!title) return

    void (async () => {
      try {
        const card = await createCard(listId, title)
        dispatch({ type: 'ADD_CARD', payload: card })
      } catch (error) {
        console.error('Failed to create card:', error)
        window.alert('Could not create card. Please try again.')
      }
    })()
  }

  const handleRenameCard = (cardId: string, currentTitle: string): void => {
    const titleInput = window.prompt('Rename card', currentTitle)
    if (titleInput === null) return

    const title = titleInput.trim()
    if (!title || title === currentTitle) return

    void (async () => {
      try {
        const updated = await updateCard(cardId, { title })
        dispatch({ type: 'UPDATE_CARD', payload: updated })
      } catch (error) {
        console.error('Failed to rename card:', error)
        window.alert('Could not rename card. Please try again.')
      }
    })()
  }

  const handleDeleteCard = (cardId: string, title: string): void => {
    const confirmed = window.confirm(`Delete card "${title}"?`)
    if (!confirmed) return

    void (async () => {
      try {
        await deleteCard(cardId)
        dispatch({ type: 'DELETE_CARD', payload: cardId })
      } catch (error) {
        console.error('Failed to delete card:', error)
        window.alert('Could not delete card. Please try again.')
      }
    })()
  }

  const handleEditCardDescription = (cardId: string, currentDescription: string | null): void => {
    const descriptionInput = window.prompt('Edit description', currentDescription ?? '')
    if (descriptionInput === null) return

    const description = descriptionInput.trim() || null

    void (async () => {
      try {
        const updated = await updateCard(cardId, { description })
        dispatch({ type: 'UPDATE_CARD', payload: updated })
      } catch (error) {
        console.error('Failed to update card description:', error)
        window.alert('Could not update description. Please try again.')
      }
    })()
  }

  const handleEditCardLabels = (cardId: string, currentLabels: string[]): void => {
    const input = window.prompt('Labels (comma-separated). Edit or remove to change.', currentLabels.join(', '))
    if (input === null) return

    const labels = [...new Set(
      input
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )]

    void (async () => {
      try {
        const updated = await updateCard(cardId, { labels })
        dispatch({ type: 'UPDATE_CARD', payload: updated })
      } catch (error) {
        console.error('Failed to update labels:', error)
        window.alert('Could not update labels. Please try again.')
      }
    })()
  }

  const handleEditCardDueDate = (cardId: string, currentDueDate: string | null): void => {
    const defaultVal = currentDueDate
      ? new Date(currentDueDate).toISOString().split('T')[0]
      : ''
    const input = window.prompt('Due date (DD-MM-YYYY). Leave empty to remove.', defaultVal)
    if (input === null) return

    const trimmed = input.trim()
    const due_date = trimmed ? (() => {
      const d = new Date(trimmed)
      if (Number.isNaN(d.getTime())) return undefined
      return d.toISOString().split('T')[0]
    })() : null

    if (trimmed && due_date === undefined) {
      window.alert('Invalid date format. Use DD-MM-YYYY.')
      return
    }

    void (async () => {
      try {
        const updated = await updateCard(cardId, { due_date })
        dispatch({ type: 'UPDATE_CARD', payload: updated })
      } catch (error) {
        console.error('Failed to update due date:', error)
        window.alert('Could not update due date. Please try again.')
      }
    })()
  }

  if (!state.currentBoard) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Select a board to view its contents</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{state.currentBoard.title}</h1>
        {state.currentBoard.description && (
          <p className="text-gray-600 mt-1">{state.currentBoard.description}</p>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {state.lists.map((list) => (
              <div key={list.id} className="w-72 bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900 truncate">{list.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Rename list ${list.title}`}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => handleRenameList(list.id, list.title)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete list ${list.title}`}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => handleDeleteList(list.id, list.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {(() => {
                  const listCards = state.cards
                    .filter((card) => card.list_id === list.id)
                    .slice()
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

                  return (
                    <SortableContext
                      items={listCards.map((card) => card.id)}
                      strategy={verticalListSortingStrategy}
                    >
                  <div className="space-y-3">
                  {listCards.map((card) => {
                    return (
                    <SortableCard
                      key={card.id}
                      card={card} 
                      onSelect={() => dispatch({ type: 'SET_SELECTED_CARD', payload: card })}
                      onEditDescription={() => handleEditCardDescription(card.id, card.description)}
                      onRename={() => handleRenameCard(card.id, card.title)}
                      onDelete={() => handleDeleteCard(card.id, card.title)}
                      onEditLabels={() => handleEditCardLabels(card.id, card.labels ?? [])}
                      onEditDueDate={() => handleEditCardDueDate(card.id, card.due_date)}
                    />
                    )
                })}
                </div>
                    </SortableContext>
                  )
                })()}
                <button
                  type="button"
                  className="w-full mt-3 p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => handleCreateCard(list.id)}
                >
                  <Plus className="h-4 w-4" />
                  Add card
                </button>
              </div>
            ))}

            <button
              onClick={handleCreateList}
              className="w-72 h-fit bg-gray-100 hover:bg-gray-200 rounded-lg p-4 transition-colors flex items-center gap-2 text-gray-600"
            >
              <Plus className="h-4 w-4" />
              Add another list
            </button>
          </div>
        </div>
      </DndContext>
    </div>
  )
}
