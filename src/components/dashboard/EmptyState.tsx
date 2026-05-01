import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApp, BOARD_STORAGE_KEY } from '../../contexts/AppContext'
import { createBoard } from '../../services/boardService'
import { applyBoardTemplate, getTemplatesForRole } from '../../services/templateService'
import { PromptDialog } from '../ui/Dialog'
import { Plus, BookOpen, GraduationCap, PenTool, Briefcase, Users } from 'lucide-react'

const roleIcons = {
  student: {
    icon: GraduationCap
  },
  teacher: {
    icon: BookOpen
  },
  writer: {
    icon: PenTool
  },
  freelancer: {
    icon: Briefcase
  },
  project_manager: {
    icon: Users
  }
}

export function EmptyState() {
  const { profile, user } = useAuth()
  const { dispatch } = useApp()
  const templates = profile?.role ? getTemplatesForRole(profile.role) : []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isApplyingTemplateId, setIsApplyingTemplateId] = useState<string | null>(null)
  const [isSavingBoard, setIsSavingBoard] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  if (!profile?.role || !user?.id) return null

  const roleData = roleIcons[profile.role]
  const Icon = roleData.icon

  const setCurrentBoard = (boardId: string): void => {
    localStorage.setItem(BOARD_STORAGE_KEY, boardId)
  }

  const handleCreateBoard = async (value: string): Promise<void> => {
    const title = value.trim()
    if (!title) return

    setIsSavingBoard(true)
    try {
      const board = await createBoard(title, user.id)
      dispatch({ type: 'ADD_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'kanban' })
      setCurrentBoard(board.id)
      setIsCreateOpen(false)
    } catch (error) {
      console.error('Failed to create board:', error)
      setErrorMessage('Could not create board. Please try again.')
    } finally {
      setIsSavingBoard(false)
    }
  }

  const handleApplyTemplate = async (templateId: string): Promise<void> => {
    setIsApplyingTemplateId(templateId)
    try {
      const board = await applyBoardTemplate(templateId, user.id)
      dispatch({ type: 'ADD_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_BOARD', payload: board })
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'kanban' })
      setCurrentBoard(board.id)
    } catch (error) {
      console.error('Failed to apply template:', error)
      setErrorMessage('Could not apply template. Please try again.')
    } finally {
      setIsApplyingTemplateId(null)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to your {profile.role} workspace!
          </h1>
          <p className="text-gray-600 text-lg">
            Get started with a template designed for your role, or create a custom board
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => void handleApplyTemplate(template.id)}
              disabled={isApplyingTemplateId !== null}
              className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left disabled:opacity-60"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              {isApplyingTemplateId === template.id && (
                <p className="mt-2 text-sm text-blue-600">Applying template...</p>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            Create Custom Board
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'home' })}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Stay on Templates
          </button>
        </div>
        {errorMessage && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="underline">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <PromptDialog
        open={isCreateOpen}
        title="Create custom board"
        label="Board name"
        placeholder="Enter board title"
        submitLabel="Create"
        loading={isSavingBoard}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(value) => void handleCreateBoard(value)}
      />
    </div>
  )
}
