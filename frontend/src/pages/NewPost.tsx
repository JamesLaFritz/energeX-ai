import React, { useState } from 'react'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function NewPost() {
    const nav = useNavigate()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [err, setErr] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null)
        try {
            await api.post('/posts', { title, content })
            nav('/') // cache is busted server-side; list will reload
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message)
        }
    }

    return (
        <form onSubmit={onSubmit} style={{maxWidth:640, margin:'32px auto', display:'grid', gap:12}}>
            <h2>New Post</h2>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"/>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Content" rows={6}/>
            {err && <div style={{color:'#ff9aa2'}}>{err}</div>}
            <button style={{background:'#22c55e',border:'none',borderRadius:8,color:'#06210e',padding:'8px 12px',cursor:'pointer'}}>Publish</button>
        </form>
    )
}
