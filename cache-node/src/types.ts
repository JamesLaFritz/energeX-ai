export interface User { id: number; name: string; email: string; }
export interface Post {
    id: number;
    title: string;
    content: string;
    user_id: number;
    created_at: string;
    updated_at: string | null;
    user?: User;
}