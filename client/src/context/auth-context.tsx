import {
  GithubAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { toast } from 'sonner'
import { http } from '../lib/http'
import { getFirebaseAuth } from '../lib/firebase'
import type { ApiResponse, User } from '../types/api'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithGoogle: () => Promise<void>
  loginWithGithub: () => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const response = await http.get<ApiResponse<User>>('/api/auth/session')
      if (response.data.success && response.data.data) {
        setUser(response.data.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  const exchangeFirebaseToken = useCallback(async (idToken: string) => {
    const response = await http.post<ApiResponse<User>>('/api/auth/login', { idToken })
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed')
    }
    setUser(response.data.data)
  }, [])

  const completeFirebaseLogin = useCallback(async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    const firebaseAuth = getFirebaseAuth()
    try {
      const credential = await signInWithPopup(firebaseAuth, provider)
      const idToken = await credential.user.getIdToken(true)
      await exchangeFirebaseToken(idToken)
      toast.success('Signed in successfully')
      return
    } catch (error) {
      const firebaseErrorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : ''

      if (firebaseErrorCode === 'auth/popup-blocked' || firebaseErrorCode === 'auth/cancelled-popup-request') {
        await signInWithRedirect(firebaseAuth, provider)
        return
      }

      throw error
    }
  }, [exchangeFirebaseToken])

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      await completeFirebaseLogin(googleProvider)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google login failed')
    } finally {
      setIsLoading(false)
    }
  }, [completeFirebaseLogin])

  const loginWithGithub = useCallback(async () => {
    setIsLoading(true)
    try {
      await completeFirebaseLogin(githubProvider)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'GitHub login failed')
    } finally {
      setIsLoading(false)
    }
  }, [completeFirebaseLogin])

  const logout = useCallback(async () => {
    try {
      await http.post('/api/auth/logout')
    } finally {
      try {
        await signOut(getFirebaseAuth())
      } catch {
        // Ignore if Firebase is not configured in this environment.
      }
      setUser(null)
      toast.success('Signed out')
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      try {
        const redirectResult = await getRedirectResult(getFirebaseAuth())
        if (redirectResult?.user) {
          const idToken = await redirectResult.user.getIdToken(true)
          await exchangeFirebaseToken(idToken)
          toast.success('Signed in successfully')
        }
      } catch {
        // Ignore redirect resolution issues and fall back to session check.
      }

      await refreshSession()
      setIsLoading(false)
    }

    initialize()

    const handleSessionExpired = () => {
      setUser(null)
      toast.error('Session expired. Please login again.')
    }

    window.addEventListener('fg:session-expired', handleSessionExpired)
    return () => window.removeEventListener('fg:session-expired', handleSessionExpired)
  }, [refreshSession, exchangeFirebaseToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      loginWithGoogle,
      loginWithGithub,
      logout,
      refreshSession,
    }),
    [isLoading, user, loginWithGoogle, loginWithGithub, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
