import { useApp, BOARD_STORAGE_KEY } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { createBoard, deleteBoard, updateBoard } from '../../services/boardService'
import { Plus, Home, Trash2, Edit2 } from 'lucide-react'
import type { Database } from '../../lib/database.types'

type Board = Database['public']['Tables']['boards']['Row']

export function Sidebar() {
  const { state, dispatch } = useApp()
  const { user } = useAuth()

    const handleSelectBoard = (board: Board): void => {
      dispatch({ type: 'SET_CURRENT_BOARD', payload: board })
      localStorage.setItem(BOARD_STORAGE_KEY, board.id)
    }

  const handleCreateBoard = async (): Promise<void> => {
    const titleInput = window.prompt('Enter board title') //this is fine for testing , but should be replaced with a proper modal in production (eg. CreateBoardModal). Create Board button → opens modal → user enters title and clicks "Create" → modal calls handleCreateBoard with title as argument. This way we can also add more fields in the future (eg. color, description, etc.) without changing the function signature. 
    if (titleInput === null) return

    const title = titleInput.trim()
    if (!title) return

    if (!user?.id) {
      window.alert('You must be signed in to create a board.')
      return
    }

    try {
      const board = await createBoard(title, user.id)
      dispatch({ type: 'ADD_BOARD', payload: board })
    } catch (error) {
      console.error('Failed to create board:', error)
      window.alert('Could not create board. Please try again.')
    }
  }

  if (!state.sidebarOpen) return null

  const views = [
    { id: 'kanban' as const, label: 'Kanban', icon: Home },
  ]

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <button
          onClick={() => void handleCreateBoard()}
          className="w-full flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Board
        </button>
      </div>

      <div className="px-4 pb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Views
        </h3>
        <nav className="space-y-1">
          {views.map((view) => {
            const Icon = view.icon
            const isActive = state.currentView === view.id

            return (
              <button
                key={view.id}
                onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: view.id })}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {view.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="px-4 pb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Your Boards
        </h3>
        <div className="space-y-1">
          {state.boards.length === 0 ? (
            <p className="text-sm text-gray-500 px-3 py-2">
              No boards yet. Create your first board!
            </p>
          ) : (
            state.boards.map((board) => (
              <div
                key={board.id}
                className={`w-full flex items-center rounded-lg text-sm transition-colors pr-1 ${
                  state.currentBoard?.id === board.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => handleSelectBoard(board)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 min-w-0"
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: board.color }}
                  />
                  <span className="truncate">{board.title}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Rename board ${board.title}`}
                  className="px-1 py-2 rounded-lg hover:bg-gray-200/70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()

                    const newTitle = window.prompt('Rename board', board.title)
                    if (newTitle === null) return

                    const trimmed = newTitle.trim()
                    if (!trimmed || trimmed === board.title) return

                    void (async () => {
                      try {
                        const updated = await updateBoard(board.id, { title: trimmed })
                        dispatch({ type: 'UPDATE_BOARD', payload: updated })
                      } catch (error) {
                        console.error('Failed to rename board:', error)
                        window.alert('Could not rename board. Please try again.')
                      }
                    })()
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete board ${board.title}`}
                  className="px-1 py-2 rounded-lg hover:bg-gray-200/70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()

                    const confirmed = window.confirm(`Delete "${board.title}"? This cannot be undone.`)
                    if (!confirmed) return

                    void (async () => {
                      try {
                        await deleteBoard(board.id)
                        dispatch({ type: 'DELETE_BOARD', payload: board.id })
                        if (state.currentBoard?.id === board.id) {
                          localStorage.removeItem(BOARD_STORAGE_KEY)
                        }
                      } catch (error) {
                        console.error('Failed to delete board:', error)
                        window.alert('Could not delete board. Please try again.')
                      }
                    })()
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
