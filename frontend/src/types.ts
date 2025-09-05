export type Post = {
    id: number
    title: string
    content: string
    user_id: number
    created_at: string
    updated_at: string
    user?: { id: number; name: string; email: string }
}
