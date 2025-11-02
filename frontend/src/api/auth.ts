// src/api/auth.ts
import api from './client';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return res.data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/register', { name, email, password });
  return res.data;
}
