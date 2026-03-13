import { useApp } from '../../contexts/AppContext'
import { createSubtask, deleteSubtask, updateSubtask } from '../../services/subtaskService'
import { Plus } from 'lucide-react'

export function CardDetail() {
  const { state, dispatch } = useApp()
  const card = state.selectedCard

  const handleCreateSubtask = (): void => {
    if (!card?.id) return
    const titleInput = window.prompt('Subtask title')
    if (titleInput === null) return
    const title = titleInput.trim()
    if (!title) return
    void (async () => {
      try {
        const subtask = await createSubtask(card.id, title)
        dispatch({ type: 'ADD_SUBTASK', payload: subtask })
      } catch (error) {
        console.error('Failed to create subtask:', error)
        window.alert('Could not create subtask. Please try again.')
      }
    })()
  }

  const handleToggleSubtask = (subtaskId: string, completed: boolean): void => {
    void (async () => {
      try {
        const updated = await updateSubtask(subtaskId, { completed: !completed })
        dispatch({ type: 'UPDATE_SUBTASK', payload: updated })
      } catch (error) {
        console.error('Failed to toggle subtask:', error)
        window.alert('Could not update subtask. Please try again.')
      }
    })()
  }

  const handleDeleteSubtask = (subtaskId: string): void => {
    void (async () => {
      try {
        await deleteSubtask(subtaskId)
        dispatch({ type: 'DELETE_SUBTASK', payload: subtaskId })
      } catch (error) {
        console.error('Failed to delete subtask:', error)
        window.alert('Could not delete subtask. Please try again.')
      }
    })()
  }

  if (!card) return null

  const subtasks = state.subtasks.filter((s) => s.card_id === card.id)

  return (
    <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{card.title}</h2>
        <button
          type="button"
          aria-label="Close"
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          onClick={() => dispatch({ type: 'SET_SELECTED_CARD', payload: null })}
        >
          ✕
        </button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {card.description && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-700">{card.description}</p>
          </div>
        )}
        {card.due_date && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Due date
            </h3>
            <p className="text-sm text-gray-700">
              {new Date(card.due_date).toLocaleDateString()}
            </p>
          </div>
        )}
        {(card.labels ?? []).length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Labels
            </h3>
            <div className="flex flex-wrap gap-1">
              {(card.labels ?? []).map((label, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Subtasks
          </h3>
          <div className="space-y-2 mb-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => handleToggleSubtask(subtask.id, subtask.completed)}
                  className="rounded border-gray-300"
                />
                <span
                  className={`text-sm flex-1 min-w-0 ${
                    subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  aria-label={`Delete subtask ${subtask.title}`}
                  className="p-1 rounded hover:bg-gray-100 shrink-0"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full flex items-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={handleCreateSubtask}
          >
            <Plus className="h-4 w-4" />
            Add subtask
          </button>
        </div>
      </div>
    </div>
  )
}
