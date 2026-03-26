import { Edit2, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Database } from '../../lib/database.types'

type Card = Database['public']['Tables']['cards']['Row']

interface SortableCardProps {
  card: Card
  onSelect: () => void
  onEditDescription: () => void
  onRename: () => void
  onDelete: () => void
  onEditLabels: () => void
  onEditDueDate: () => void
}

export function SortableCard({
  card,
  onSelect,
  onEditDescription,
  onRename,
  onDelete,
  onEditLabels,
  onEditDueDate
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: card.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
      <div
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600"
      >
        ⋮⋮
      </div>
      <h4 className="font-medium text-gray-900 text-left">{card.title}</h4>
      <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label={`Rename card ${card.title}`}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onRename()
            }}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete card ${card.title}`}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {card.description ? (
        <p 
          className="text-sm text-gray-600 mb-2"
          onDoubleClick={(e) => {
            e.stopPropagation()
            onEditDescription()
          }}>{card.description}</p>
      ):(
        <button
        className='text-sm text-gray-400 hover:text-gray-600 mb-2 text-left'
        onClick={(e) => {
          e.stopPropagation()
          onEditDescription()
        }}
        >
          + Add Description 
        </button>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {(card.labels ?? []).map((label, index) => (
          <button
            key={index}
            type="button"
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onEditLabels()
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onEditLabels()
          }}
        >
          {(card.labels ?? []).length > 0 ? '+ Add label' : 'Add label'}
        </button>
      </div>

      <button
        type="button"
        className="text-xs text-gray-500 hover:text-gray-700 hover:underline text-left"
        onClick={(e) => {
          e.stopPropagation()
          onEditDueDate()
        }}
      >
        {card.due_date
          ? `Due: ${new Date(card.due_date).toLocaleDateString()}`
          : 'Add due date'}
      </button>
    </div>
  )
}

