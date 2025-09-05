import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { NavBar } from './components/NavBar'
import Register from './pages/Register'
import Login from './pages/Login'
import PostList from './pages/PostList'
import NewPost from './pages/NewPost'

function Private({ children }: { children: React.ReactNode }) {
    const { token } = useAuth()
    if (!token) return <Navigate to="/login" replace />
    return <>{children}</>
}

export default function App() {
    return (
        <>
            <NavBar />
            <Routes>
                <Route path="/" element={<Private><PostList /></Private>} />
                <Route path="/new" element={<Private><NewPost /></Private>} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </>
    )
}
