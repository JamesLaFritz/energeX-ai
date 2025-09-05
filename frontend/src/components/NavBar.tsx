import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export const NavBar: React.FC = () => {
    const { token, logout } = useAuth()
    const nav = useNavigate()

    return (
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'12px 16px',borderBottom:'1px solid #1c2633'}}>
            <div style={{fontWeight:700}}>energeX</div>
            <div style={{flex:1}} />
            <Link to="/" style={{color:'#9acbff'}}>Posts</Link>
            {token ? (
                <>
                    <Link to="/new" style={{color:'#9acbff'}}>New Post</Link>
                    <button
                        onClick={() => { logout(); nav('/login') }}
                        style={{marginLeft:12, background:'#173a63', color:'#e7edf3', border:'1px solid #28507c', borderRadius:8, padding:'6px 10px', cursor:'pointer'}}
                    >
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <Link to="/register" style={{color:'#9acbff'}}>Register</Link>
                    <Link to="/login" style={{color:'#9acbff'}}>Login</Link>
                </>
            )}
        </div>
    )
}
