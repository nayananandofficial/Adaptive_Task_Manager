import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import type { Database } from '../lib/database.types'
import { useAuth } from './AuthContext'
import { getBoards } from '../services/boardService'
import { getLists } from '../services/listService'
import { getCards } from '../services/cardService'
import { getSubtasks } from '../services/subtaskService'

export const BOARD_STORAGE_KEY = 'adaptive-task-manager-current-board-id'

type Board = Database['public']['Tables']['boards']['Row']
type List = Database['public']['Tables']['lists']['Row']
type Card = Database['public']['Tables']['cards']['Row']
type Subtask = Database['public']['Tables']['subtasks']['Row']

interface AppState {
  currentBoard: Board | null
  boards: Board[]
  lists: List[]
  cards: Card[]
  subtasks: Subtask[]
  selectedCard: Card | null
  currentView: 'kanban'
  sidebarOpen: boolean
  focusToday: string | null
}

type AppAction =
  | { type: 'SET_CURRENT_BOARD'; payload: Board | null }
  | { type: 'SET_BOARDS'; payload: Board[] }
  | { type: 'SET_LISTS'; payload: List[] }
  | { type: 'SET_CARDS'; payload: Card[] }
  | { type: 'SET_SUBTASKS'; payload: Subtask[] }
  | { type: 'SET_SELECTED_CARD'; payload: Card | null }
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_FOCUS_TODAY'; payload: string | null }
  | { type: 'ADD_BOARD'; payload: Board }
  | { type: 'UPDATE_BOARD'; payload: Board }
  | { type: 'DELETE_BOARD'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'ADD_CARD'; payload: Card }
  | { type: 'UPDATE_CARD'; payload: Card }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'REORDER_CARDS_IN_LIST'; payload: { listId: string; cardIds: string[] } }
  | { type: 'MOVE_CARD'; payload: { cardId: string; fromListId: string; toListId: string; fromCardIds: string[]; toCardIds: string[] } }
  | { type: 'ADD_SUBTASK'; payload: Subtask }
  | { type: 'UPDATE_SUBTASK'; payload: Subtask }
  | { type: 'DELETE_SUBTASK'; payload: string }
  | { type: 'RESET_STATE'}

const initialState: AppState = {
  currentBoard: null,
  boards: [],
  lists: [],
  cards: [],
  subtasks: [],
  selectedCard: null,
  currentView: 'kanban',
  sidebarOpen: true,
  focusToday: null
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_BOARD':
      return { ...state, currentBoard: action.payload }
    case 'SET_BOARDS':
      return { ...state, boards: action.payload }
    case 'SET_LISTS':
      return { ...state, lists: action.payload }
    case 'SET_CARDS':
      return { ...state, cards: action.payload }
    case 'SET_SUBTASKS':
      return { ...state, subtasks: action.payload }
    case 'SET_SELECTED_CARD':
      return { ...state, selectedCard: action.payload }
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_FOCUS_TODAY':
      return { ...state, focusToday: action.payload }
    case 'ADD_BOARD':
      return { ...state, boards: [...state.boards, action.payload] }
    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map(board =>
          board.id === action.payload.id ? action.payload : board
        ),
        currentBoard: state.currentBoard?.id === action.payload.id ? action.payload : state.currentBoard
      }
    case 'DELETE_BOARD':
      return {
        ...state,
        boards: state.boards.filter(board => board.id !== action.payload),
        currentBoard: state.currentBoard?.id === action.payload ? null : state.currentBoard
      }
    case 'ADD_LIST':
      return { ...state, lists: [...state.lists, action.payload] }
    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map(list =>
          list.id === action.payload.id ? action.payload : list
        )
      }
    case 'DELETE_LIST':
      return {
        ...state,
        lists: state.lists.filter(list => list.id !== action.payload),
        cards: state.cards.filter(card => card.list_id !== action.payload)
      }
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.payload] }
    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.id ? action.payload : card
        ),
        selectedCard: state.selectedCard?.id === action.payload.id ? action.payload : state.selectedCard
      }
    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter(card => card.id !== action.payload),
        selectedCard: state.selectedCard?.id === action.payload ? null : state.selectedCard
      }
    case 'REORDER_CARDS_IN_LIST': {
      const { listId, cardIds } = action.payload
      const positionById = new Map(cardIds.map((id, idx) => [id, idx]))

      return {
        ...state,
        cards: state.cards.map((card) => {
          if (card.list_id !== listId) return card
          const pos = positionById.get(card.id)
          if (pos === undefined) return card
          return { ...card, position: pos }
        })
      }
    }
    case 'MOVE_CARD': {
      const { cardId, fromListId, toListId, fromCardIds, toCardIds } = action.payload
      const fromPos = new Map(fromCardIds.map((id, idx) => [id, idx]))
      const toPos = new Map(toCardIds.map((id, idx) => [id, idx]))

      const nextCards = state.cards.map((card) => {
        if (card.id === cardId) {
          return { ...card, list_id: toListId, position: toPos.get(cardId) ?? card.position }
        }
        if (card.list_id === fromListId) {
          const pos = fromPos.get(card.id)
          if (pos === undefined) return card
          return { ...card, position: pos }
        }
        if (card.list_id === toListId) {
          const pos = toPos.get(card.id)
          if (pos === undefined) return card
          return { ...card, position: pos }
        }
        return card
      })

      const nextSelected =
        state.selectedCard?.id === cardId
          ? nextCards.find((c) => c.id === cardId) ?? state.selectedCard
          : state.selectedCard

      return { ...state, cards: nextCards, selectedCard: nextSelected }
    }
    case 'ADD_SUBTASK':
      return { ...state, subtasks: [...state.subtasks, action.payload] }
    case 'UPDATE_SUBTASK':
      return {
        ...state,
        subtasks: state.subtasks.map(subtask =>
          subtask.id === action.payload.id ? action.payload : subtask
        )
      }
    case 'DELETE_SUBTASK':
      return {
        ...state,
        subtasks: state.subtasks.filter(subtask => subtask.id !== action.payload)
      }
      case 'RESET_STATE':
        return { ...initialState }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const { user } = useAuth()

  useEffect(() => {
    let isActive = true

    const loadBoards = async (): Promise<void> => {
      if (!user?.id) return

      try {
        const boards = await getBoards(user.id) //currently when the app loads this function is fine because the board amount is small, In the future you might also load: lists and cards here, or implement pagination if the user has a lot of boards. For now we can just load all boards and filter them in the UI, but if performance becomes an issue we can add pagination or load lists/cards on demand when a board is selected.
        if (!isActive) return
        dispatch({ type: 'SET_BOARDS', payload: boards })

        const savedBoardId = localStorage.getItem(BOARD_STORAGE_KEY)
        if (savedBoardId) {
          const board = boards.find((b) => b.id === savedBoardId)
          if (board) {
            dispatch({ type: 'SET_CURRENT_BOARD', payload: board })
          }
        }
      } catch (error) {
        console.error('Failed to load boards:', error)
      }
    }

    void loadBoards()

    return () => {
      isActive = false
    }
  }, [user?.id])

  useEffect(() => {
    let isActive = true

    const boardId = state.currentBoard?.id
    if (!boardId) {
      dispatch({ type: 'SET_LISTS', payload: [] })
      dispatch({ type: 'SET_CARDS', payload: [] })
      return () => {
        isActive = false
      }
    }

    dispatch({ type: 'SET_LISTS', payload: [] })
    dispatch({ type: 'SET_CARDS', payload: [] })

    const loadListsAndCards = async (): Promise<void> => {
      try {
        const lists = await getLists(boardId)
        if (!isActive) return
        dispatch({ type: 'SET_LISTS', payload: lists })

        const cardGroups = await Promise.all(lists.map((list) => getCards(list.id)))
        if (!isActive) return
        dispatch({ type: 'SET_CARDS', payload: cardGroups.flat() })
      } catch (error) {
        console.error('Failed to load lists/cards:', error)
      }
    }

    void loadListsAndCards()

    return () => {
      isActive = false
    }
  }, [state.currentBoard?.id])

  useEffect(() => {
    let isActive = true
    const cardId = state.selectedCard?.id

    if (!cardId) {
      dispatch({ type: 'SET_SUBTASKS', payload: [] })
      return () => {
        isActive = false
      }
    }

    dispatch({ type: 'SET_SUBTASKS', payload: [] })

    const loadSubtasks = async (): Promise<void> => {
      try {
        const subtasks = await getSubtasks(cardId)
        if (!isActive) return
        dispatch({ type: 'SET_SUBTASKS', payload: subtasks })
      } catch (error) {
        console.error('Failed to load subtasks:', error)
      }
    }

    void loadSubtasks()

    return () => {
      isActive = false
    }
  }, [state.selectedCard?.id])


  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
