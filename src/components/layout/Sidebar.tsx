import { useState } from 'react'
import { useApp, BOARD_STORAGE_KEY } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { createBoard, deleteBoard, updateBoard } from '../../services/boardService'
import { Dialog, PromptDialog } from '../ui/Dialog'
import { Plus, Home, Trash2, Edit2, LayoutGrid } from 'lucide-react'
import type { Database } from '../../lib/database.types'

type Board = Database['public']['Tables']['boards']['Row']

export function Sidebar() {
  const { state, dispatch } = useApp()
  const { user } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Board | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSelectBoard = (board: Board): void => {
      dispatch({ type: 'SET_CURRENT_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'kanban' })
      localStorage.setItem(BOARD_STORAGE_KEY, board.id)
    }

  const handleCreateBoard = async (value: string): Promise<void> => {
    const title = value.trim()
    if (!title) return

    if (!user?.id) {
      setErrorMessage('You must be signed in to create a board.')
      return
    }

    setIsSaving(true)
    try {
      const board = await createBoard(title, user.id)
      dispatch({ type: 'ADD_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'kanban' })
      localStorage.setItem(BOARD_STORAGE_KEY, board.id)
      setIsCreateOpen(false)
    } catch (error) {
      console.error('Failed to create board:', error)
      setErrorMessage('Could not create board. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!state.sidebarOpen) return null

  const views = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'kanban' as const, label: 'Board View', icon: LayoutGrid }
  ]

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <button
          onClick={() => setIsCreateOpen(true)}
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

                    setRenameTarget(board)
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

                    setDeleteTarget(board)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      {errorMessage && (
        <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <div className="flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <PromptDialog
        open={isCreateOpen}
        title="Create board"
        description="Start with a custom board. Use Home to create from templates."
        label="Board name"
        placeholder="Board title"
        submitLabel="Create"
        loading={isSaving}
        onClose={() => {
          if (!isSaving) setIsCreateOpen(false)
        }}
        onSubmit={(value) => void handleCreateBoard(value)}
      />

      <PromptDialog
        open={renameTarget !== null}
        title="Rename board"
        label="Board name"
        defaultValue={renameTarget?.title ?? ''}
        submitLabel="Rename"
        onClose={() => setRenameTarget(null)}
        onSubmit={(value) => {
          if (!renameTarget) return
          const trimmed = value.trim()
          if (!trimmed || trimmed === renameTarget.title) {
            setRenameTarget(null)
            return
          }
          void (async () => {
            try {
              const updated = await updateBoard(renameTarget.id, { title: trimmed })
              dispatch({ type: 'UPDATE_BOARD', payload: updated })
              setRenameTarget(null)
            } catch (error) {
              console.error('Failed to rename board:', error)
              setErrorMessage('Could not rename board. Please try again.')
            }
          })()
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        title="Delete board"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          void (async () => {
            try {
              await deleteBoard(deleteTarget.id)
              dispatch({ type: 'DELETE_BOARD', payload: deleteTarget.id })
              if (state.currentBoard?.id === deleteTarget.id) {
                localStorage.removeItem(BOARD_STORAGE_KEY)
                dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' })
              }
              setDeleteTarget(null)
            } catch (error) {
              console.error('Failed to delete board:', error)
              setErrorMessage('Could not delete board. Please try again.')
            }
          })()
        }}
      />
    </aside>
  )
}
