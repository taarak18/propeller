import { createContext, useContext } from 'react'

// Shared auth context: exposes the current principal and actions
// (switchPrincipal, logout) plus a sessionKey used to force refetch on switch.
export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)
