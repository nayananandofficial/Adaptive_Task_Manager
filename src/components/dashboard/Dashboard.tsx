import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { EmptyState } from './EmptyState'
import { KanbanView } from '../views/KanbanView'
import { CardDetail } from '../cards/CardDetail'

const roleMessages = {
  student: 'Track coursework and hit your deadlines with a consistent study flow.',
  teacher: 'Plan lessons and monitor classroom progress from one place.',
  writer: 'Keep your creative pipeline moving from idea to publication.',
  freelancer: 'Stay ahead on clients, deliverables, and business priorities.',
  project_manager: 'Coordinate team execution, risks, and milestones effectively.'
}

export function Dashboard() {
  const { state } = useApp()
  const { profile } = useAuth()

  if (state.currentView === 'home' || state.boards.length === 0) {
    return <EmptyState />
  }

  // Show current view
  const MainView = (() => {
    switch (state.currentView) {
      case 'kanban':
        return <KanbanView />
      default:
        return <KanbanView />
    }
  })()

  return (
    <div className="flex flex-1 min-w-0 h-full">
      <div className="flex-1 min-w-0 flex flex-col">
        {profile?.role && (
          <div className="mx-4 mt-4 mb-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-900">
              {roleMessages[profile.role]}
            </p>
          </div>
        )}
        <div className="flex-1 min-w-0">{MainView}</div>
      </div>
      {state.selectedCard && <CardDetail />}
    </div>
  )
}
