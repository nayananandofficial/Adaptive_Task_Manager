import { useEffect, useRef, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { Edit2, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createList, deleteList, updateList } from "../../services/listService";
import {
  createCard,
  deleteCard,
  updateCard,
  updateCardsPositions,
} from "../../services/cardService";
import { DragOverlayCard, SortableCard } from "../cards/SortableCard";
import type { Database } from "../../lib/database.types";
import { Dialog, PromptDialog } from "../ui/Dialog";

type List = Database["public"]["Tables"]["lists"]["Row"];
type Card = Database["public"]["Tables"]["cards"]["Row"];

type DragMutation =
  | {
      type: "REORDER";
      listId: string;
      cardIds: string[];
      nextCards: Card[];
    }
  | {
      type: "MOVE";
      cardId: string;
      fromListId: string;
      toListId: string;
      fromCardIds: string[];
      toCardIds: string[];
      nextCards: Card[];
    };

interface KanbanListColumnProps {
  list: List;
  cards: Card[];
  onRenameList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onCreateCard: (listId: string) => void;
  onSelectCard: (card: Card) => void;
  onEditCardDescription: (cardId: string) => void;
  onRenameCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onEditCardLabels: (cardId: string) => void;
  onEditCardDueDate: (cardId: string) => void;
}

function sortCardsByPosition(cards: Card[]): Card[] {
  return cards.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function getCardsForList(cards: Card[], listId: string): Card[] {
  return sortCardsByPosition(cards.filter((card) => card.list_id === listId));
}

function getCardIdsForList(cards: Card[], listId: string): string[] {
  return getCardsForList(cards, listId).map((card) => card.id);
}

function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card }));
}

function applyReorder(cards: Card[], listId: string, cardIds: string[]): Card[] {
  const positionById = new Map(cardIds.map((id, index) => [id, index]));

  return cards.map((card) => {
    if (card.list_id !== listId) return card;

    const nextPosition = positionById.get(card.id);
    if (nextPosition === undefined) return card;

    return { ...card, position: nextPosition };
  });
}

function applyMove(
  cards: Card[],
  cardId: string,
  fromListId: string,
  toListId: string,
  fromCardIds: string[],
  toCardIds: string[],
): Card[] {
  const fromPositions = new Map(fromCardIds.map((id, index) => [id, index]));
  const toPositions = new Map(toCardIds.map((id, index) => [id, index]));

  return cards.map((card) => {
    if (card.id === cardId) {
      return {
        ...card,
        list_id: toListId,
        position: toPositions.get(cardId) ?? card.position,
      };
    }

    if (card.list_id === fromListId) {
      const nextPosition = fromPositions.get(card.id);
      if (nextPosition === undefined) return card;
      return { ...card, position: nextPosition };
    }

    if (card.list_id === toListId) {
      const nextPosition = toPositions.get(card.id);
      if (nextPosition === undefined) return card;
      return { ...card, position: nextPosition };
    }

    return card;
  });
}

function computeDragMutation(
  cards: Card[],
  lists: List[],
  activeId: string,
  overId: string,
  allowSameListReorder: boolean,
): DragMutation | null {
  if (activeId === overId) return null;

  const activeCard = cards.find((card) => card.id === activeId);
  if (!activeCard) return null;

  const overCard = cards.find((card) => card.id === overId);
  const overList = lists.find((list) => list.id === overId);

  if (!overCard && !overList) return null;

  const targetListId = overCard?.list_id ?? overList?.id;
  if (!targetListId) return null;

  if (activeCard.list_id === targetListId) {
    if (!allowSameListReorder) return null;

    const listCards = getCardsForList(cards, targetListId);
    const oldIndex = listCards.findIndex((card) => card.id === activeId);
    const newIndex = overCard
      ? listCards.findIndex((card) => card.id === overCard.id)
      : listCards.length - 1;

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return null;
    }

    const cardIds = arrayMove(listCards, oldIndex, newIndex).map(
      (card) => card.id,
    );

    return {
      type: "REORDER",
      listId: targetListId,
      cardIds,
      nextCards: applyReorder(cards, targetListId, cardIds),
    };
  }

  const fromCardIds = getCardIdsForList(cards, activeCard.list_id).filter(
    (id) => id !== activeId,
  );
  const targetCardIds = getCardIdsForList(cards, targetListId).filter(
    (id) => id !== activeId,
  );
  const insertIndex = overCard
    ? targetCardIds.indexOf(overCard.id)
    : targetCardIds.length;
  const safeInsertIndex =
    insertIndex >= 0 ? insertIndex : targetCardIds.length;
  const toCardIds = targetCardIds.slice();

  toCardIds.splice(safeInsertIndex, 0, activeId);

  return {
    type: "MOVE",
    cardId: activeId,
    fromListId: activeCard.list_id,
    toListId: targetListId,
    fromCardIds,
    toCardIds,
    nextCards: applyMove(
      cards,
      activeId,
      activeCard.list_id,
      targetListId,
      fromCardIds,
      toCardIds,
    ),
  };
}

function didListOrderChange(
  beforeCards: Card[],
  afterCards: Card[],
  listId: string,
): boolean {
  const beforeIds = getCardIdsForList(beforeCards, listId);
  const afterIds = getCardIdsForList(afterCards, listId);

  if (beforeIds.length !== afterIds.length) return true;

  return beforeIds.some((id, index) => id !== afterIds[index]);
}

function KanbanListColumn({
  list,
  cards,
  onRenameList,
  onDeleteList,
  onCreateCard,
  onSelectCard,
  onEditCardDescription,
  onRenameCard,
  onDeleteCard,
  onEditCardLabels,
  onEditCardDueDate,
}: KanbanListColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
  });

  const listCards = getCardsForList(cards, list.id);

  return (
    <div
      ref={setNodeRef}
      className={`w-72 rounded-lg p-4 transition-colors ${
        isOver ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-100"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="truncate font-semibold text-gray-900">{list.title}</h3>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Rename list ${list.title}`}
            className="rounded p-1 transition-colors hover:bg-gray-200"
            onClick={() => onRenameList(list.id)}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete list ${list.title}`}
            className="rounded p-1 transition-colors hover:bg-gray-200"
            onClick={() => onDeleteList(list.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <SortableContext
        items={listCards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {listCards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onSelect={() => onSelectCard(card)}
              onEditDescription={() => onEditCardDescription(card.id)}
              onRename={() => onRenameCard(card.id)}
              onDelete={() => onDeleteCard(card.id)}
              onEditLabels={() => onEditCardLabels(card.id)}
              onEditDueDate={() => onEditCardDueDate(card.id)}
            />
          ))}
          {listCards.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-2 text-sm text-gray-500">
              No cards yet.
            </p>
          )}
        </div>
      </SortableContext>

      <button
        type="button"
        className="mt-3 flex w-full items-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200"
        onClick={() => onCreateCard(list.id)}
      >
        <Plus className="h-4 w-4" />
        Add card
      </button>
    </div>
  );
}

export function KanbanView() {
  const { state, dispatch } = useApp();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [renameListTarget, setRenameListTarget] = useState<List | null>(null);
  const [deleteListTarget, setDeleteListTarget] = useState<List | null>(null);
  const [createCardListId, setCreateCardListId] = useState<string | null>(null);
  const [renameCardTarget, setRenameCardTarget] = useState<Card | null>(null);
  const [deleteCardTarget, setDeleteCardTarget] = useState<Card | null>(null);
  const [descriptionCardTarget, setDescriptionCardTarget] = useState<Card | null>(null);
  const [labelsCardTarget, setLabelsCardTarget] = useState<Card | null>(null);
  const [dueDateCardTarget, setDueDateCardTarget] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const cardsRef = useRef(state.cards);
  const dragSnapshotRef = useRef<Card[] | null>(null);
  const dragOriginListIdRef = useRef<string | null>(null);

  useEffect(() => {
    cardsRef.current = state.cards;
  }, [state.cards]);

  const applyMutation = (mutation: DragMutation): Card[] => {
    if (mutation.type === "REORDER") {
      dispatch({
        type: "REORDER_CARDS_IN_LIST",
        payload: { listId: mutation.listId, cardIds: mutation.cardIds },
      });
      cardsRef.current = mutation.nextCards;
      return mutation.nextCards;
    }

    dispatch({
      type: "MOVE_CARD",
      payload: {
        cardId: mutation.cardId,
        fromListId: mutation.fromListId,
        toListId: mutation.toListId,
        fromCardIds: mutation.fromCardIds,
        toCardIds: mutation.toCardIds,
      },
    });
    cardsRef.current = mutation.nextCards;
    return mutation.nextCards;
  };

  const resetDragState = (): void => {
    setActiveCardId(null);
    dragOriginListIdRef.current = null;
    dragSnapshotRef.current = null;
  };

  const restoreDragSnapshot = (): void => {
    const snapshot = dragSnapshotRef.current;

    if (snapshot) {
      dispatch({ type: "SET_CARDS", payload: snapshot });
      cardsRef.current = snapshot;
    }

    resetDragState();
  };

  const handleDragStart = ({ active }: DragStartEvent): void => {
    const activeId = String(active.id);
    const activeCard = cardsRef.current.find((card) => card.id === activeId);

    if (!activeCard) return;

    dragSnapshotRef.current = cloneCards(cardsRef.current);
    dragOriginListIdRef.current = activeCard.list_id;
    setActiveCardId(activeId);
  };

  const handleDragOver = ({ active, over }: DragOverEvent): void => {
    if (!over) return;

    const activeId = String(active.id);
    const activeCard = cardsRef.current.find((card) => card.id === activeId);
    if (!activeCard) return;

    const allowSameListReorder =
      dragOriginListIdRef.current !== null &&
      dragOriginListIdRef.current !== activeCard.list_id;

    const mutation = computeDragMutation(
      cardsRef.current,
      state.lists,
      activeId,
      String(over.id),
      allowSameListReorder,
    );

    if (!mutation) return;

    applyMutation(mutation);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    const activeId = String(active.id);
    const snapshot = dragSnapshotRef.current;

    if (!over || !snapshot) {
      restoreDragSnapshot();
      return;
    }

    const mutation = computeDragMutation(
      cardsRef.current,
      state.lists,
      activeId,
      String(over.id),
      true,
    );

    const finalCards = mutation ? applyMutation(mutation) : cardsRef.current;
    const finalCard = finalCards.find((card) => card.id === activeId);

    if (!finalCard || !dragOriginListIdRef.current) {
      restoreDragSnapshot();
      return;
    }

    const listIdsToPersist = new Set([
      dragOriginListIdRef.current,
      finalCard.list_id,
    ]);
    const changedListIds = [...listIdsToPersist].filter((listId) =>
      didListOrderChange(snapshot, finalCards, listId),
    );

    resetDragState();

    if (changedListIds.length === 0) {
      return;
    }

    void (async () => {
      try {
        await updateCardsPositions(
          changedListIds.flatMap((listId) =>
            getCardsForList(finalCards, listId).map((card, index) => ({
              id: card.id,
              list_id: listId,
              position: index,
            })),
          ),
        );
      } catch (error) {
        console.error("Failed to persist card order:", error);

        if (snapshot) {
          dispatch({ type: "SET_CARDS", payload: snapshot });
          cardsRef.current = snapshot;
        }
      }
    })();
  };

  const handleCreateList = (value: string): void => {
    const boardId = state.currentBoard?.id;
    if (!boardId) {
      setErrorMessage("Select a board first.");
      return;
    }
    const title = value.trim();
    if (!title) return;

    void (async () => {
      try {
        const list = await createList(boardId, title);
        dispatch({ type: "ADD_LIST", payload: list });
        setCreateListOpen(false);
      } catch (error) {
        console.error("Failed to create list:", error);
        setErrorMessage("Could not create list. Please try again.");
      }
    })();
  };

  const handleRenameList = (listId: string): void => {
    const target = state.lists.find((list) => list.id === listId);
    if (!target) return;
    setRenameListTarget(target);
  };

  const submitRenameList = (titleValue: string): void => {
    if (!renameListTarget) return;
    const title = titleValue.trim();
    if (!title || title === renameListTarget.title) {
      setRenameListTarget(null);
      return;
    }
    void (async () => {
      try {
        const updated = await updateList(renameListTarget.id, { title });
        dispatch({ type: "UPDATE_LIST", payload: updated });
        setRenameListTarget(null);
      } catch (error) {
        console.error("Failed to rename list:", error);
        setErrorMessage("Could not rename list. Please try again.");
      }
    })();
  };

  const handleDeleteList = (listId: string): void => {
    const target = state.lists.find((list) => list.id === listId);
    if (!target) return;
    setDeleteListTarget(target);
  };

  const confirmDeleteList = (): void => {
    if (!deleteListTarget) return;
    void (async () => {
      try {
        await deleteList(deleteListTarget.id);
        dispatch({ type: "DELETE_LIST", payload: deleteListTarget.id });
        setDeleteListTarget(null);
      } catch (error) {
        console.error("Failed to delete list:", error);
        setErrorMessage("Could not delete list. Please try again.");
      }
    })();
  };

  const handleCreateCard = (listId: string): void => {
    setCreateCardListId(listId);
  };

  const submitCreateCard = (titleValue: string): void => {
    if (!createCardListId) return;
    const title = titleValue.trim();
    if (!title) return;

    void (async () => {
      try {
        const card = await createCard(createCardListId, title);
        dispatch({ type: "ADD_CARD", payload: card });
        setCreateCardListId(null);
      } catch (error) {
        console.error("Failed to create card:", error);
        setErrorMessage("Could not create card. Please try again.");
      }
    })();
  };

  const handleRenameCard = (cardId: string): void => {
    const target = state.cards.find((card) => card.id === cardId);
    if (!target) return;
    setRenameCardTarget(target);
  };

  const submitRenameCard = (titleValue: string): void => {
    if (!renameCardTarget) return;
    const title = titleValue.trim();
    if (!title || title === renameCardTarget.title) {
      setRenameCardTarget(null);
      return;
    }
    void (async () => {
      try {
        const updated = await updateCard(renameCardTarget.id, { title });
        dispatch({ type: "UPDATE_CARD", payload: updated });
        setRenameCardTarget(null);
      } catch (error) {
        console.error("Failed to rename card:", error);
        setErrorMessage("Could not rename card. Please try again.");
      }
    })();
  };

  const handleDeleteCard = (cardId: string): void => {
    const target = state.cards.find((card) => card.id === cardId);
    if (!target) return;
    setDeleteCardTarget(target);
  };

  const confirmDeleteCard = (): void => {
    if (!deleteCardTarget) return;
    void (async () => {
      try {
        await deleteCard(deleteCardTarget.id);
        dispatch({ type: "DELETE_CARD", payload: deleteCardTarget.id });
        setDeleteCardTarget(null);
      } catch (error) {
        console.error("Failed to delete card:", error);
        setErrorMessage("Could not delete card. Please try again.");
      }
    })();
  };

  const handleEditCardDescription = (cardId: string): void => {
    const target = state.cards.find((card) => card.id === cardId);
    if (!target) return;
    setDescriptionCardTarget(target);
  };

  const submitCardDescription = (value: string): void => {
    if (!descriptionCardTarget) return;
    const description = value.trim() || null;
    void (async () => {
      try {
        const updated = await updateCard(descriptionCardTarget.id, { description });
        dispatch({ type: "UPDATE_CARD", payload: updated });
        setDescriptionCardTarget(null);
      } catch (error) {
        console.error("Failed to update card description:", error);
        setErrorMessage("Could not update description. Please try again.");
      }
    })();
  };

  const handleEditCardLabels = (cardId: string): void => {
    const target = state.cards.find((card) => card.id === cardId);
    if (!target) return;
    setLabelsCardTarget(target);
  };

  const submitCardLabels = (input: string): void => {
    if (!labelsCardTarget) return;
    const labels = [
      ...new Set(
        input
          .split(",")
          .map((label) => label.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    void (async () => {
      try {
        const updated = await updateCard(labelsCardTarget.id, { labels });
        dispatch({ type: "UPDATE_CARD", payload: updated });
        setLabelsCardTarget(null);
      } catch (error) {
        console.error("Failed to update labels:", error);
        setErrorMessage("Could not update labels. Please try again.");
      }
    })();
  };

  const handleEditCardDueDate = (cardId: string): void => {
    const target = state.cards.find((card) => card.id === cardId);
    if (!target) return;
    setDueDateCardTarget(target);
  };

  const submitCardDueDate = (input: string): void => {
    if (!dueDateCardTarget) return;
    const trimmed = input.trim();
    const due_date = trimmed
      ? (() => {
          const date = new Date(trimmed);
          if (Number.isNaN(date.getTime())) return undefined;
          return date.toISOString().split("T")[0];
        })()
      : null;

    if (trimmed && due_date === undefined) {
      setErrorMessage("Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    void (async () => {
      try {
        const updated = await updateCard(dueDateCardTarget.id, { due_date });
        dispatch({ type: "UPDATE_CARD", payload: updated });
        setDueDateCardTarget(null);
      } catch (error) {
        console.error("Failed to update due date:", error);
        setErrorMessage("Could not update due date. Please try again.");
      }
    })();
  };

  if (!state.currentBoard) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Select a board to view its contents</p>
      </div>
    );
  }

  const activeCard =
    state.cards.find((card) => card.id === activeCardId) ??
    dragSnapshotRef.current?.find((card) => card.id === activeCardId) ??
    null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {state.currentBoard.title}
        </h1>
        {state.currentBoard.description && (
          <p className="mt-1 text-gray-600">{state.currentBoard.description}</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={restoreDragSnapshot}
      >
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex min-w-max gap-6">
            {state.lists.map((list) => (
              <KanbanListColumn
                key={list.id}
                list={list}
                cards={state.cards}
              onRenameList={(listId) => handleRenameList(listId)}
              onDeleteList={(listId) => handleDeleteList(listId)}
                onCreateCard={handleCreateCard}
                onSelectCard={(card) =>
                  dispatch({
                    type: "SET_SELECTED_CARD",
                    payload: card,
                  })
                }
              onEditCardDescription={(cardId) => handleEditCardDescription(cardId)}
              onRenameCard={(cardId) => handleRenameCard(cardId)}
              onDeleteCard={(cardId) => handleDeleteCard(cardId)}
              onEditCardLabels={(cardId) => handleEditCardLabels(cardId)}
              onEditCardDueDate={(cardId) => handleEditCardDueDate(cardId)}
              />
            ))}

            <button
              type="button"
              onClick={() => setCreateListOpen(true)}
              className="flex h-fit w-72 items-center gap-2 rounded-lg bg-gray-100 p-4 text-gray-600 transition-colors hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add another list
            </button>
          </div>
        </div>

        <DragOverlay>
          {activeCard ? <DragOverlayCard card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
      {errorMessage && (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <PromptDialog
        open={createListOpen}
        title="Create list"
        label="List name"
        placeholder="e.g. Backlog"
        submitLabel="Create"
        onClose={() => setCreateListOpen(false)}
        onSubmit={handleCreateList}
      />
      <PromptDialog
        open={renameListTarget !== null}
        title="Rename list"
        label="List name"
        defaultValue={renameListTarget?.title ?? ""}
        submitLabel="Rename"
        onClose={() => setRenameListTarget(null)}
        onSubmit={submitRenameList}
      />
      <Dialog
        open={deleteListTarget !== null}
        title="Delete list"
        description={
          deleteListTarget
            ? `Delete list "${deleteListTarget.title}"? This will also remove its cards.`
            : undefined
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onClose={() => setDeleteListTarget(null)}
        onConfirm={confirmDeleteList}
      />
      <PromptDialog
        open={createCardListId !== null}
        title="Create card"
        label="Card title"
        placeholder="What needs to be done?"
        submitLabel="Create"
        onClose={() => setCreateCardListId(null)}
        onSubmit={submitCreateCard}
      />
      <PromptDialog
        open={renameCardTarget !== null}
        title="Rename card"
        label="Card title"
        defaultValue={renameCardTarget?.title ?? ""}
        submitLabel="Rename"
        onClose={() => setRenameCardTarget(null)}
        onSubmit={submitRenameCard}
      />
      <Dialog
        open={deleteCardTarget !== null}
        title="Delete card"
        description={deleteCardTarget ? `Delete card "${deleteCardTarget.title}"?` : undefined}
        confirmLabel="Delete"
        confirmVariant="danger"
        onClose={() => setDeleteCardTarget(null)}
        onConfirm={confirmDeleteCard}
      />
      <PromptDialog
        open={descriptionCardTarget !== null}
        title="Edit description"
        label="Description"
        defaultValue={descriptionCardTarget?.description ?? ""}
        multiline
        submitLabel="Save"
        onClose={() => setDescriptionCardTarget(null)}
        onSubmit={submitCardDescription}
      />
      <PromptDialog
        open={labelsCardTarget !== null}
        title="Edit labels"
        label="Labels (comma separated)"
        defaultValue={labelsCardTarget?.labels?.join(", ") ?? ""}
        submitLabel="Save"
        onClose={() => setLabelsCardTarget(null)}
        onSubmit={submitCardLabels}
      />
      <PromptDialog
        open={dueDateCardTarget !== null}
        title="Edit due date"
        label="Due date"
        type="date"
        defaultValue={
          dueDateCardTarget?.due_date
            ? new Date(dueDateCardTarget.due_date).toISOString().split("T")[0]
            : ""
        }
        submitLabel="Save"
        onClose={() => setDueDateCardTarget(null)}
        onSubmit={submitCardDueDate}
      />
    </div>
  );
}
