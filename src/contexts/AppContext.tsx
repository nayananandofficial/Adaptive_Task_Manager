import React, { createContext, useContext, useReducer } from 'react'
import type { Database } from '../lib/database.types'

type Board = Database['public']['Tables']['boards']['Row']
type List = Database['public']['Tables']['lists']['Row']
type Card = Database['public']['Tables']['cards']['Row']

interface AppState {
  currentBoard: Board | null
  boards: Board[]
  lists: List[]
  cards: Card[]
  currentView: 'kanban' | 'calendar' | 'timeline' | 'list'
  sidebarOpen: boolean
  focusToday: string | null
}

type AppAction =
  | { type: 'SET_CURRENT_BOARD'; payload: Board | null }
  | { type: 'SET_BOARDS'; payload: Board[] }
  | { type: 'SET_LISTS'; payload: List[] }
  | { type: 'SET_CARDS'; payload: Card[] }
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

const initialState: AppState = {
  currentBoard: null,
  boards: [],
  lists: [],
  cards: [],
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
        )
      }
    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter(card => card.id !== action.payload)
      }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}