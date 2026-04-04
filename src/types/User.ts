export interface User {
    id: number;
    cpf: string;
    name: string;
    email?: string;
    phone?: string;
    role: string; // <-- Mudou de userType para role
    organization?: { // <-- Adicione isso para suportar o novo modelo SaaS
        id: number;
        name: string;
        planType: string;
    };
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
    role?: string;     // <-- Adicionado para alinhar com o Employee do Java
    userType?: string; // <-- Mantenha como opcional se o form ainda usa esse nome
}

export interface AuthResponse {
    token: string;
    user: User;
}