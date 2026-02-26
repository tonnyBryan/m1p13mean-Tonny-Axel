export interface User {
    _id?: string;
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'boutique';
    isActive: boolean;
    isEmailVerified: boolean;
    avatar: string | null;
}
