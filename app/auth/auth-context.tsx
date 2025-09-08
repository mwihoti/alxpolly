'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (params: { email: string; password: string }) => Promise<{ error?: string }>
  signUp: (params: { email: string; password: string; name?: string }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * AuthProvider
 *
 * Provides authenticated user and session state to Client Components using a React Context.
 * It wires Supabase's auth session to React state, listens for token refresh, and exposes
 * high-level helpers for email/password sign-in, sign-up, and sign-out.
 *
 * Why needed: Centralizes auth state management (user/session/loading) so any component can
 * reliably consume the same source of truth without duplicating Supabase client calls.
 *
 * Security considerations:
 * - Never store passwords. The provider only passes credentials to Supabase over HTTPS.
 * - The session listener keeps access tokens fresh; avoid manually persisting tokens.
 * - UI that depends on `user` should also handle `loading` to prevent flicker-based info leaks.
 *
 * @example
 * // Access current user and log out from any client component
 * 'use client'
 * import { useAuth } from '@/auth/auth-context'
 *
 * export function Toolbar() {
 *   const { user, signOut, loading } = useAuth()
 *   if (loading) return null
 *   return user ? <button onClick={signOut}>Sign out</button> : null
 * }
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Initial session fetch; includes access/refresh tokens managed by supabase-js under the hood.
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to auth events, including automatic token refresh.
    // This ensures `session` and `user` stay current without manual timers.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      isMounted = false
      // Important: unsubscribe to avoid memory leaks on fast navigation
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    /**
     * signIn
     *
     * Email/password authentication that delegates credentials directly to Supabase.
     *
     * @param params.email - User email address
     * @param params.password - User password (never stored; passed directly to Supabase)
     * @returns Promise resolving with optional error string when authentication fails
     * @throws Never throws; returns `{ error }` shape for UI-friendly handling
     *
     * @example
     * const { error } = await signIn({ email, password })
     * if (error) showToast(error)
     */
    async signIn({ email, password }) {
      // Supabase handles rate limiting and security; avoid logging raw credentials.
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message }
    },
    /**
     * signUp
     *
     * Creates an account via Supabase email/password and optionally sets `name` in user metadata.
     * Can trigger an email verification depending on project settings.
     *
     * @param params.email - Email for the new account
     * @param params.password - Initial password
     * @param params.name - Optional display name stored in user metadata
     * @returns Promise resolving with optional error string
     * @throws Never throws; returns `{ error }` for UI-friendly handling
     *
     * @example
     * const { error } = await signUp({ email, password, name })
     * if (!error) notify('Check your inbox to verify your email')
     */
    async signUp({ email, password, name }) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Store minimal PII only in metadata; avoid sensitive data here.
          data: name ? { name } : undefined,
          // Adjust for your hosted domain or deep-link target.
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      })
      return { error: error?.message }
    },
    /**
     * signOut
     *
     * Clears the current session and invalidates tokens on the client.
     * Supabase revokes the refresh token; access token naturally expires shortly after.
     *
     * @returns Promise that resolves when the client session is cleared
     * @throws Never throws; errors are swallowed by Supabase client in most cases
     *
     * @example
     * await signOut()
     * router.push('/auth/login')
     */
    async signOut() {
      await supabase.auth.signOut()
    },
  }), [user, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth
 *
 * React hook to access the `AuthContext`.
 * Throws if used outside of the `AuthProvider` to surface integration mistakes early.
 *
 * @returns AuthContextValue - current user, session, loading state and auth helpers
 * @throws Error when called outside an `AuthProvider`
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/**
 * Protected
 *
 * Client-side protection wrapper for sections/pages requiring authentication.
 * If no user is present after loading, redirects to `/auth/login` using a hard navigation.
 *
 * Note: For highly sensitive pages, prefer server-side guards using the server Supabase client
 * to prevent unauthorized content flashes.
 *
 * @param children - Content to render when authenticated
 * @returns ReactNode or null while loading / redirecting
 *
 * @example
 * 'use client'
 * import { Protected } from '@/auth/auth-context'
 *
 * export default function Dashboard() {
 *   return (
 *     <Protected>
 *       <main>Private content</main>
 *     </Protected>
 *   )
 * }
 */
export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    // Security: avoid rendering private UI when unauthenticated; full reload prevents stale state.
    if (typeof window !== 'undefined') window.location.href = '/auth/login'
    return null
  }
  return children
}

/**
 * OAuth integration points (documentation-only):
 *
 * To add OAuth providers (e.g., Google, GitHub), use:
 *
 * @example
 * // Client-side OAuth sign-in example
 * await supabase.auth.signInWithOAuth({
 *   provider: 'google',
 *   options: {
 *     redirectTo: `${window.location.origin}/auth/callback`,
 *     scopes: 'email profile',
 *   },
 * })
 *
 * // In `app/auth/callback/route.ts`, you can handle post-auth redirects if needed.
 * // Supabase manages tokens and session storage automatically on return.
 *
 * Password reset flow:
 * - Trigger: `await supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/auth/reset' })`
 * - Handle reset page: call `supabase.auth.updateUser({ password: '<new>' })` when access token is present.
 */