export interface User {
    id: number;
    cpf: string;
    name: string;
    email?: string;
    phone?: string;
    userType: string;
    createdAt: string;
}

export interface LoginCredentials {
    cpf: string;
    password: string;
}

export interface RegisterData {
    cpf: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    userType?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}