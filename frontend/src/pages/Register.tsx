import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Register() {
    const { register } = useAuth()
    const nav = useNavigate()
    const [name, setName] = useState('Demo 2')
    const [email, setEmail] = useState('demo2@example.com')
    const [password, setPassword] = useState('password123')
    const [err, setErr] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null)
        try {
            await register(name, email, password)
            nav('/login')
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message)
        }
    }

    return (
        <form onSubmit={onSubmit} style={{maxWidth:480, margin:'32px auto', display:'grid', gap:12}}>
            <h2>Register</h2>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"/>
            {err && <div style={{color:'#ff9aa2'}}>{err}</div>}
            <button style={{background:'#2563eb',border:'none',borderRadius:8,color:'white',padding:'8px 12px',cursor:'pointer'}}>Create account</button>
        </form>
    )
}
