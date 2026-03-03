// Lightweight session wrapper that uses `clms_user` stored by `authApi`/`AuthProvider`.
interface Session {
  userId: string
  email: string
  role: string
}

export const setSession = (session: Session) => {
  if (typeof window !== 'undefined') localStorage.setItem('clms_user', JSON.stringify(session))
}

export const getSession = (): Session | null => {
  if (typeof window === 'undefined') return null
  const s = localStorage.getItem('clms_user')
  return s ? JSON.parse(s) : null
}

export const clearSession = () => {
  if (typeof window !== 'undefined') localStorage.removeItem('clms_user')
}

export const isAuthenticated = (): boolean => getSession() !== null

export const isAdmin = (): boolean => getSession()?.role === 'admin'
