import type { CSSProperties, MouseEvent } from "react";
import { Edit2, GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Database } from "../../lib/database.types";

type Card = Database["public"]["Tables"]["cards"]["Row"];

interface CardSurfaceProps {
  card: Card;
  isDragging?: boolean;
  isOverlay?: boolean;
  onSelect?: () => void;
  onEditDescription?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onEditLabels?: () => void;
  onEditDueDate?: () => void;
  dragHandleProps?: Record<string, unknown>;
  setDragHandleRef?: (element: HTMLElement | null) => void;
}

interface SortableCardProps {
  card: Card;
  onSelect: () => void;
  onEditDescription: () => void;
  onRename: () => void;
  onDelete: () => void;
  onEditLabels: () => void;
  onEditDueDate: () => void;
}

function stopCardClick(
  event: MouseEvent<HTMLButtonElement | HTMLParagraphElement>,
  callback?: () => void,
): void {
  event.stopPropagation();
  callback?.();
}

function CardSurface({
  card,
  isDragging = false,
  isOverlay = false,
  onSelect,
  onEditDescription,
  onRename,
  onDelete,
  onEditLabels,
  onEditDueDate,
  dragHandleProps,
  setDragHandleRef,
}: CardSurfaceProps) {
  return (
    <div
      className={`rounded-lg border bg-white p-3 text-left shadow-sm transition-[box-shadow,opacity] ${
        isOverlay
          ? "w-72 rotate-[1deg] border-blue-200 shadow-xl"
          : "border-gray-200"
      } ${isDragging ? "opacity-40 shadow-md" : "hover:shadow-md"} ${
        isOverlay ? "cursor-grabbing" : "cursor-pointer"
      }`}
      onClick={onSelect}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <button
          type="button"
          ref={setDragHandleRef}
          aria-label={`Drag card ${card.title}`}
          className={`mt-0.5 rounded p-1 text-gray-400 transition-colors ${
            isOverlay
              ? "cursor-grabbing"
              : "cursor-grab active:cursor-grabbing hover:text-gray-600"
          }`}
          onClick={(event) => event.stopPropagation()}
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <h4 className="flex-1 font-medium text-gray-900">{card.title}</h4>

        {!isOverlay && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={`Rename card ${card.title}`}
              className="rounded p-1 transition-colors hover:bg-gray-100"
              onClick={(event) => stopCardClick(event, onRename)}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={`Delete card ${card.title}`}
              className="rounded p-1 transition-colors hover:bg-gray-100"
              onClick={(event) => stopCardClick(event, onDelete)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {card.description ? (
        <p
          className="mb-2 text-sm text-gray-600"
          onDoubleClick={
            isOverlay
              ? undefined
              : (event) => stopCardClick(event, onEditDescription)
          }
        >
          {card.description}
        </p>
      ) : !isOverlay ? (
        <button
          type="button"
          className="mb-2 text-left text-sm text-gray-400 transition-colors hover:text-gray-600"
          onClick={(event) => stopCardClick(event, onEditDescription)}
        >
          + Add Description
        </button>
      ) : null}

      {(card.labels ?? []).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {(card.labels ?? []).map((label, index) => (
            <button
              key={`${label}-${index}`}
              type="button"
              className={`rounded px-2 py-1 text-xs ${
                isOverlay
                  ? "bg-blue-100 text-blue-700"
                  : "bg-blue-100 text-blue-700 transition-colors hover:bg-blue-200"
              }`}
              onClick={
                isOverlay
                  ? undefined
                  : (event) => stopCardClick(event, onEditLabels)
              }
            >
              {label}
            </button>
          ))}

          {!isOverlay && (
            <button
              type="button"
              className="rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100"
              onClick={(event) => stopCardClick(event, onEditLabels)}
            >
              + Add label
            </button>
          )}
        </div>
      )}

      {!isOverlay && (card.labels ?? []).length === 0 && (
        <button
          type="button"
          className="mb-2 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100"
          onClick={(event) => stopCardClick(event, onEditLabels)}
        >
          Add label
        </button>
      )}

      {isOverlay ? (
        card.due_date ? (
          <p className="text-xs text-gray-500">
            Due: {new Date(card.due_date).toLocaleDateString()}
          </p>
        ) : null
      ) : (
        <button
          type="button"
          className="text-left text-xs text-gray-500 transition-colors hover:text-gray-700 hover:underline"
          onClick={(event) => stopCardClick(event, onEditDueDate)}
        >
          {card.due_date
            ? `Due: ${new Date(card.due_date).toLocaleDateString()}`
            : "Add due date"}
        </button>
      )}
    </div>
  );
}

export function SortableCard({
  card,
  onSelect,
  onEditDescription,
  onRename,
  onDelete,
  onEditLabels,
  onEditDueDate,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: "none",
    willChange: isDragging ? "transform" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CardSurface
        card={card}
        isDragging={isDragging}
        onSelect={onSelect}
        onEditDescription={onEditDescription}
        onRename={onRename}
        onDelete={onDelete}
        onEditLabels={onEditLabels}
        onEditDueDate={onEditDueDate}
        dragHandleProps={{ ...attributes, ...listeners }}
        setDragHandleRef={setActivatorNodeRef}
      />
    </div>
  );
}

export function DragOverlayCard({ card }: { card: Card }) {
  return <CardSurface card={card} isOverlay />;
}
