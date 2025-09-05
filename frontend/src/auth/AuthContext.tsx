import React, { createContext, useContext, useMemo, useState } from 'react'
import { api } from '../api/client'

type AuthCtx = {
    token: string | null
    setToken: (t: string | null) => void
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => void
}
const Ctx = createContext<AuthCtx | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'))

    const setToken = (t: string | null) => {
        if (t) localStorage.setItem('token', t)
        else localStorage.removeItem('token')
        setTokenState(t)
    }

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/login', { email, password })
        setToken(data.token)
    }

    const register = async (name: string, email: string, password: string) => {
        await api.post('/register', { name, email, password })
    }

    const logout = () => setToken(null)

    const value = useMemo(() => ({ token, setToken, login, register, logout }), [token])
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useAuth must be inside AuthProvider')
    return ctx
}
