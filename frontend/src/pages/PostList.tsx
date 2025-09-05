import React, { useEffect, useState } from 'react'
import { api, cacheApi } from '../api/client'
import type { Post } from '../types'

export default function PostList() {
    const [useCache, setUseCache] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const load = async () => {
        setErr(null);
        setLoading(true);
        try {
            const res = useCache
                ? await cacheApi.get('/posts')  // no auth needed
                : await api.get('/posts');      // JWT attached by interceptor

            const data = res.data;
            const next = Array.isArray(data)
                ? data
                : Array.isArray(data?.value)
                    ? data.value
                    : [];
            setPosts(next);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [useCache]);

    return (
        <div style={{ maxWidth: 840, margin: '24px auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Posts</h2>
                <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={useCache} onChange={e => setUseCache(e.target.checked)} />
                    Use cache API
                </label>
                <button onClick={load}
                        style={{ background: '#173a63', border: '1px solid #28507c', borderRadius: 8,
                            color: '#e7edf3', padding: '6px 10px', cursor: 'pointer' }}>
                    Refresh
                </button>
            </div>

            {loading && <div>Loading…</div>}
            {err && <div style={{ color: '#ff9aa2' }}>{err}</div>}

            <div style={{ display: 'grid', gap: 12 }}>
                {posts.map(p => (
                    <div key={p.id}
                         style={{ border: '1px solid #1c2633', borderRadius: 12, padding: 16, background: '#0f1622' }}>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{p.title}</div>
                        <div style={{ opacity: .9, marginTop: 6, whiteSpace: 'pre-wrap' }}>{p.content}</div>
                        {p.user && (
                            <div style={{ marginTop: 8, fontSize: 13, opacity: .8 }}>
                                by {p.user.name} ({p.user.email})
                            </div>
                        )}
                    </div>
                ))}
                {!loading && posts.length === 0 && <div>No posts yet.</div>}
            </div>
        </div>
    );
}
