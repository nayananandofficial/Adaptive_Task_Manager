import { useApp } from '../../contexts/AppContext'
import { EmptyState } from './EmptyState'
import { KanbanView } from '../views/KanbanView'
import { CardDetail } from '../cards/CardDetail'

export function Dashboard() {
  const { state } = useApp()

  // Show focus prompt if user hasn't set focus for today
  // if (!state.focusToday) {
  //   return <FocusPrompt />
  // }

  // Show empty state if no boards
  if (state.boards.length === 0) {
    return <EmptyState />
  }

  // Show current view
  const MainView = (() => {
    switch (state.currentView) {
      case 'kanban':
        return <KanbanView />
      case 'calendar':
        return <div className="p-8">Calendar view coming soon...</div>
      case 'timeline':
        return <div className="p-8">Timeline view coming soon...</div>
      case 'list':
        return <div className="p-8">List view coming soon...</div>
      default:
        return <KanbanView />
    }
  })()

  return (
    <div className="flex flex-1 min-w-0 h-full">
      <div className="flex-1 min-w-0">{MainView}</div>
      {state.selectedCard && <CardDetail />}
    </div>
  )
}
