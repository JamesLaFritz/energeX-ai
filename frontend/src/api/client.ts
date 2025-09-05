import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE as string
export const CACHE_BASE = import.meta.env.VITE_CACHE_BASE as string

export const api = axios.create({ baseURL: API_BASE })
export const cacheApi = axios.create({ baseURL: CACHE_BASE })

// attach JWT from localStorage
const withAuth = (instance: typeof api) => {
    instance.interceptors.request.use(cfg => {
        const token = localStorage.getItem('token')
        if (token) cfg.headers.Authorization = `Bearer ${token}`
        return cfg
    })
}
withAuth(api)
// cache endpoints don't need auth, but you can add if you secure it
