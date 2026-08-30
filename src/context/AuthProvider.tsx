import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { observeAuthState } from '../services/auth'
import { AuthContext } from './AuthContext'

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = observeAuthState((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo(() => ({ user, loading }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
