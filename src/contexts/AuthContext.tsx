import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileInsert = Database['public']['Tables']['users']['Insert']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']
type AuthUser = {
  id: string
  email: string | null
  user_metadata?: User['user_metadata']
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isLocalAuth: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: UserProfileUpdate) => Promise<void>
  refetchProfile: () => Promise<void>
}

interface LocalAuthState {
  user: AuthUser
  profile: UserProfile
}

const LOCAL_AUTH_STORAGE_KEY = 'atm.local-auth-state'
const DEFAULT_ROLE: UserProfile['role'] = 'student'
const AuthContext = createContext<AuthContextType | undefined>(undefined)

function safeGetMetadataString(
  metadata: User['user_metadata'] | undefined,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function buildDefaultProfile(authUser: AuthUser): UserProfile {
  const now = new Date().toISOString()
  const nameFromMetadata = safeGetMetadataString(authUser.user_metadata, 'full_name')
  const nameFromEmail =
    authUser.email && authUser.email.includes('@') ? authUser.email.split('@')[0] : null

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: nameFromMetadata ?? nameFromEmail,
    avatar_url: safeGetMetadataString(authUser.user_metadata, 'avatar_url'),
    role: DEFAULT_ROLE,
    onboarded: false,
    created_at: now,
    updated_at: now
  }
}

function mapSupabaseUser(authUser: User): AuthUser {
  return {
    id: authUser.id,
    email: authUser.email ?? null,
    user_metadata: authUser.user_metadata
  }
}

function loadLocalAuthState(): LocalAuthState | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as LocalAuthState
    if (!parsed?.user?.id || !parsed?.profile?.id) return null
    return parsed
  } catch {
    return null
  }
}

function persistLocalAuthState(state: LocalAuthState | null): void {
  if (typeof window === 'undefined') return
  if (!state) {
    window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(state))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLocalAuth, setIsLocalAuth] = useState(
    import.meta.env.VITE_BYPASS_AUTH === 'true' || !supabase
  )

  const initializeLocalState = useCallback(() => {
    const snapshot = loadLocalAuthState()
    setSession(null)
    setUser(snapshot?.user ?? null)
    setProfile(snapshot?.profile ?? null)
    setLoading(false)
  }, [])

  const enableLocalAuthFallback = useCallback(() => {
    setIsLocalAuth(true)
    initializeLocalState()
  }, [initializeLocalState])

  const fetchOrCreateProfile = useCallback(async (authUser: AuthUser): Promise<UserProfile> => {
    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }

    const { data: existingProfile, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (selectError) {
      throw selectError
    }

    if (existingProfile) {
      return existingProfile
    }

    const insertPayload: UserProfileInsert = {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: safeGetMetadataString(authUser.user_metadata, 'full_name'),
      avatar_url: safeGetMetadataString(authUser.user_metadata, 'avatar_url'),
      role: DEFAULT_ROLE,
      onboarded: false
    }

    const { data: createdProfile, error: insertError } = await supabase
      .from('users')
      .insert(insertPayload)
      .select('*')
      .single()

    if (insertError) {
      if (insertError.code === '23505' || insertError.code === '409') {
        const { data: retryProfile, error: retryError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        if (!retryError && retryProfile) {
          return retryProfile
        }
      }
      throw insertError
    }

    return createdProfile
  }, [])

  const createOrUpdateLocalState = useCallback(
    (email: string, metadata?: AuthUser['user_metadata']) => {
      const normalizedEmail = email.trim().toLowerCase()
      const existing = loadLocalAuthState()
      const id =
        existing?.user.email?.toLowerCase() === normalizedEmail
          ? existing.user.id
          : crypto.randomUUID()

      const localUser: AuthUser = {
        id,
        email: normalizedEmail,
        user_metadata: metadata ?? existing?.user.user_metadata
      }

      const nextProfile =
        existing?.profile.id === id
          ? {
              ...existing.profile,
              email: normalizedEmail,
              full_name:
                safeGetMetadataString(localUser.user_metadata, 'full_name') ??
                existing.profile.full_name,
              avatar_url:
                safeGetMetadataString(localUser.user_metadata, 'avatar_url') ??
                existing.profile.avatar_url,
              updated_at: new Date().toISOString()
            }
          : buildDefaultProfile(localUser)

      const snapshot: LocalAuthState = {
        user: localUser,
        profile: nextProfile
      }

      persistLocalAuthState(snapshot)
      setSession(null)
      setUser(localUser)
      setProfile(nextProfile)
    },
    []
  )

  const refetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    if (isLocalAuth) {
      const snapshot = loadLocalAuthState()
      setProfile(snapshot?.profile ?? null)
      return
    }

    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }

    const latestProfile = await fetchOrCreateProfile(user)
    setProfile(latestProfile)
  }, [fetchOrCreateProfile, isLocalAuth, user])

  useEffect(() => {
    let isMounted = true

    const initializeSupabaseSession = async () => {
      if (!supabase || isLocalAuth) {
        initializeLocalState()
        return
      }

      try {
        setLoading(true)
        const {
          data: { session: activeSession },
          error
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!isMounted) return

        setSession(activeSession)
        const activeUser = activeSession?.user ? mapSupabaseUser(activeSession.user) : null
        setUser(activeUser)

        if (!activeUser) {
          setProfile(null)
          setLoading(false)
          return
        }

        const fetchedProfile = await fetchOrCreateProfile(activeUser)
        if (!isMounted) return

        setProfile(fetchedProfile)
        setLoading(false)
      } catch (error) {
        console.error('Falling back to local auth because Supabase is unavailable:', error)
        if (!isMounted) return
        enableLocalAuthFallback()
      }
    }

    void initializeSupabaseSession()

    if (!supabase || isLocalAuth) {
      return () => {
        isMounted = false
      }
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, activeSession: Session | null) => {
      if (!isMounted) return

      setSession(activeSession)
      const activeUser = activeSession?.user ? mapSupabaseUser(activeSession.user) : null
      setUser(activeUser)

      if (!activeUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      void fetchOrCreateProfile(activeUser)
        .then((fetchedProfile) => {
          if (!isMounted) return
          setProfile(fetchedProfile)
        })
        .catch((error) => {
          console.error('Failed to fetch profile after auth state change:', error)
          if (!isMounted) return
          setProfile(null)
        })
        .finally(() => {
          if (!isMounted) return
          setLoading(false)
        })
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [enableLocalAuthFallback, fetchOrCreateProfile, initializeLocalState, isLocalAuth])

  const signInWithGoogle = useCallback(async () => {
    if (isLocalAuth) {
      createOrUpdateLocalState('local.google.user@example.com', { full_name: 'Local User' })
      return
    }

    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }

    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })

    if (error) {
      throw error
    }
  }, [createOrUpdateLocalState, isLocalAuth])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isLocalAuth) {
        createOrUpdateLocalState(email)
        return
      }

      if (!supabase) {
        throw new Error('Supabase client is not configured')
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }
    },
    [createOrUpdateLocalState, isLocalAuth]
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isLocalAuth) {
        createOrUpdateLocalState(email, { full_name: email.split('@')[0] })
        return
      }

      if (!supabase) {
        throw new Error('Supabase client is not configured')
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      })

      if (error) {
        throw error
      }
    },
    [createOrUpdateLocalState, isLocalAuth]
  )

  const signOut = useCallback(async () => {
    if (isLocalAuth) {
      persistLocalAuthState(null)
      setSession(null)
      setUser(null)
      setProfile(null)
      return
    }

    if (!supabase) {
      throw new Error('Supabase client is not configured')
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }, [isLocalAuth])

  const updateProfile = useCallback(
    async (updates: UserProfileUpdate) => {
      if (!user) {
        throw new Error('No authenticated user')
      }

      if (isLocalAuth) {
        const current = loadLocalAuthState()
        if (!current || current.user.id !== user.id) {
          throw new Error('No local profile found')
        }

        const nextProfile: UserProfile = {
          ...current.profile,
          ...updates,
          updated_at: new Date().toISOString()
        }

        const snapshot: LocalAuthState = {
          user: current.user,
          profile: nextProfile
        }

        persistLocalAuthState(snapshot)
        setProfile(nextProfile)
        return
      }

      if (!supabase) {
        throw new Error('Supabase client is not configured')
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
    },
    [isLocalAuth, user]
  )

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      isLocalAuth,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updateProfile,
      refetchProfile
    }),
    [
      isLocalAuth,
      loading,
      profile,
      refetchProfile,
      session,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      signUpWithEmail,
      updateProfile,
      user
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
