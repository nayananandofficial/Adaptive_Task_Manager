import { useApp } from '../../contexts/AppContext'

export function CardDetail() {
  const { state, dispatch } = useApp()
  const card = state.selectedCard

  if (!card) return null

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
        {card.due_date && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Due date
            </h3>
            <p className="text-sm text-gray-700">
              {new Date(card.due_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
