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
  onRenameList: (listId: string, currentTitle: string) => void;
  onDeleteList: (listId: string, title: string) => void;
  onCreateCard: (listId: string) => void;
  onSelectCard: (card: Card) => void;
  onEditCardDescription: (
    cardId: string,
    currentDescription: string | null,
  ) => void;
  onRenameCard: (cardId: string, currentTitle: string) => void;
  onDeleteCard: (cardId: string, title: string) => void;
  onEditCardLabels: (cardId: string, currentLabels: string[]) => void;
  onEditCardDueDate: (cardId: string, currentDueDate: string | null) => void;
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
            onClick={() => onRenameList(list.id, list.title)}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete list ${list.title}`}
            className="rounded p-1 transition-colors hover:bg-gray-200"
            onClick={() => onDeleteList(list.id, list.title)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <SortableContext
        items={listCards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-24 space-y-3">
          {listCards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onSelect={() => onSelectCard(card)}
              onEditDescription={() =>
                onEditCardDescription(card.id, card.description)
              }
              onRename={() => onRenameCard(card.id, card.title)}
              onDelete={() => onDeleteCard(card.id, card.title)}
              onEditLabels={() => onEditCardLabels(card.id, card.labels ?? [])}
              onEditDueDate={() => onEditCardDueDate(card.id, card.due_date)}
            />
          ))}
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

  const handleCreateList = (): void => {
    const boardId = state.currentBoard?.id;
    if (!boardId) {
      window.alert("Select a board first.");
      return;
    }

    const titleInput = window.prompt("List title");
    if (titleInput === null) return;

    const title = titleInput.trim();
    if (!title) return;

    void (async () => {
      try {
        const list = await createList(boardId, title);
        dispatch({ type: "ADD_LIST", payload: list });
      } catch (error) {
        console.error("Failed to create list:", error);
        window.alert("Could not create list. Please try again.");
      }
    })();
  };

  const handleRenameList = (listId: string, currentTitle: string): void => {
    const titleInput = window.prompt("Rename list", currentTitle);
    if (titleInput === null) return;

    const title = titleInput.trim();
    if (!title || title === currentTitle) return;

    void (async () => {
      try {
        const updated = await updateList(listId, { title });
        dispatch({ type: "UPDATE_LIST", payload: updated });
      } catch (error) {
        console.error("Failed to rename list:", error);
        window.alert("Could not rename list. Please try again.");
      }
    })();
  };

  const handleDeleteList = (listId: string, title: string): void => {
    const confirmed = window.confirm(
      `Delete list "${title}"? This will also remove its cards.`,
    );
    if (!confirmed) return;

    void (async () => {
      try {
        await deleteList(listId);
        dispatch({ type: "DELETE_LIST", payload: listId });
      } catch (error) {
        console.error("Failed to delete list:", error);
        window.alert("Could not delete list. Please try again.");
      }
    })();
  };

  const handleCreateCard = (listId: string): void => {
    const titleInput = window.prompt("Card title");
    if (titleInput === null) return;

    const title = titleInput.trim();
    if (!title) return;

    void (async () => {
      try {
        const card = await createCard(listId, title);
        dispatch({ type: "ADD_CARD", payload: card });
      } catch (error) {
        console.error("Failed to create card:", error);
        window.alert("Could not create card. Please try again.");
      }
    })();
  };

  const handleRenameCard = (cardId: string, currentTitle: string): void => {
    const titleInput = window.prompt("Rename card", currentTitle);
    if (titleInput === null) return;

    const title = titleInput.trim();
    if (!title || title === currentTitle) return;

    void (async () => {
      try {
        const updated = await updateCard(cardId, { title });
        dispatch({ type: "UPDATE_CARD", payload: updated });
      } catch (error) {
        console.error("Failed to rename card:", error);
        window.alert("Could not rename card. Please try again.");
      }
    })();
  };

  const handleDeleteCard = (cardId: string, title: string): void => {
    const confirmed = window.confirm(`Delete card "${title}"?`);
    if (!confirmed) return;

    void (async () => {
      try {
        await deleteCard(cardId);
        dispatch({ type: "DELETE_CARD", payload: cardId });
      } catch (error) {
        console.error("Failed to delete card:", error);
        window.alert("Could not delete card. Please try again.");
      }
    })();
  };

  const handleEditCardDescription = (
    cardId: string,
    currentDescription: string | null,
  ): void => {
    const descriptionInput = window.prompt(
      "Add description",
      currentDescription ?? "",
    );
    if (descriptionInput === null) return;

    const description = descriptionInput.trim() || null;

    void (async () => {
      try {
        const updated = await updateCard(cardId, { description });
        dispatch({ type: "UPDATE_CARD", payload: updated });
      } catch (error) {
        console.error("Failed to update card description:", error);
        window.alert("Could not update description. Please try again.");
      }
    })();
  };

  const handleEditCardLabels = (
    cardId: string,
    currentLabels: string[],
  ): void => {
    const input = window.prompt(
      "Labels (comma-separated). Edit or remove to change.",
      currentLabels.join(", "),
    );
    if (input === null) return;

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
        const updated = await updateCard(cardId, { labels });
        dispatch({ type: "UPDATE_CARD", payload: updated });
      } catch (error) {
        console.error("Failed to update labels:", error);
        window.alert("Could not update labels. Please try again.");
      }
    })();
  };

  const handleEditCardDueDate = (
    cardId: string,
    currentDueDate: string | null,
  ): void => {
    const defaultValue = currentDueDate
      ? new Date(currentDueDate).toISOString().split("T")[0]
      : "";
    const input = window.prompt(
      "Due date (YYYY-MM-DD). Leave empty to remove.",
      defaultValue,
    );
    if (input === null) return;

    const trimmed = input.trim();
    const due_date = trimmed
      ? (() => {
          const date = new Date(trimmed);
          if (Number.isNaN(date.getTime())) return undefined;
          return date.toISOString().split("T")[0];
        })()
      : null;

    if (trimmed && due_date === undefined) {
      window.alert("Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    void (async () => {
      try {
        const updated = await updateCard(cardId, { due_date });
        dispatch({ type: "UPDATE_CARD", payload: updated });
      } catch (error) {
        console.error("Failed to update due date:", error);
        window.alert("Could not update due date. Please try again.");
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
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
                onCreateCard={handleCreateCard}
                onSelectCard={(card) =>
                  dispatch({
                    type: "SET_SELECTED_CARD",
                    payload: card,
                  })
                }
                onEditCardDescription={handleEditCardDescription}
                onRenameCard={handleRenameCard}
                onDeleteCard={handleDeleteCard}
                onEditCardLabels={handleEditCardLabels}
                onEditCardDueDate={handleEditCardDueDate}
              />
            ))}

            <button
              type="button"
              onClick={handleCreateList}
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
    </div>
  );
}
