import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser, Portal, Role } from '../types'
import { seed } from '../data/seed'

const STORAGE_KEY = 'eduasset.auth'

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string, portal: Portal) => AuthUser
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function buildUser(portal: Portal, email: string): AuthUser {
  const portalKey = portal === 'central' ? 'CENTRAL' : 'LAB'
  const match =
    seed.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase()) ??
    seed.users.find((candidate) => candidate.portal === portalKey)

  return {
    id: match?.id ?? `demo-${portal}`,
    name: match?.name ?? (portal === 'central' ? 'Property Custodian' : 'Lab Assistant'),
    email,
    role: (match?.role ?? (portal === 'central' ? 'CENTRAL_CUSTODIAN' : 'LAB_ASSISTANT')) as Role,
    portal,
  }
}

function readStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (!parsed.id || !parsed.portal || (parsed.portal !== 'central' && parsed.portal !== 'lab')) {
      return null
    }
    return parsed as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStored())

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (email, _password, portal) => {
        const next = buildUser(portal, email)
        setUser(next)
        return next
      },
      logout: () => setUser(null),
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
