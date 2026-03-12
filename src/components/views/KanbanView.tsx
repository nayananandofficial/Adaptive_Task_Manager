import { useApp } from '../../contexts/AppContext'
import { Plus } from 'lucide-react'
import { createList } from '../../services/listService'

export function KanbanView() {
  const { state, dispatch } = useApp()

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

      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {state.lists.map((list) => (
            <div key={list.id} className="w-72 bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{list.title}</h3>
              
              <div className="space-y-3">
                {state.cards
                  .filter(card => card.list_id === list.id)
                  .map((card) => (
                    <div
                      key={card.id}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{card.title}</h4>
                      {card.description && (
                        <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                      )}
                      {card.labels.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {card.labels.map((label, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                      {card.due_date && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(card.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
              </div>

              <button className="w-full mt-3 p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add a card
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
    </div>
  )
}
