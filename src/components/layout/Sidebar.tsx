import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { createBoard } from '../../services/boardService'
import { Plus, Home, Calendar, BarChart3, List, Settings } from 'lucide-react'

export function Sidebar() {
  const { state, dispatch } = useApp()
  const { user } = useAuth()

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
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'timeline' as const, label: 'Timeline', icon: BarChart3 },
    { id: 'list' as const, label: 'List', icon: List },
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
              <button
                key={board.id}
                onClick={() => dispatch({ type: 'SET_CURRENT_BOARD', payload: board })}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  state.currentBoard?.id === board.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: board.color }}
                />
                <span className="truncate">{board.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}
