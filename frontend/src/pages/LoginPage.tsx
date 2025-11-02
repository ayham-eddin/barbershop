// src/pages/LoginPage.tsx
import { useState } from 'react';
import type { AxiosError } from 'axios';
import api from '../api/client';

export interface LoginPageProps {
  onLogin: (token: string, role: 'user' | 'admin') => void;
}

function extractErrorMessage(err: unknown): string {
  const fallback = 'Request failed';
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    // Axios-style error shape
    const ax = err as AxiosError<{ error?: string; message?: string }>;
    const msg =
      ax.response?.data?.error ??
      ax.response?.data?.message ??
      (ax.message || fallback);
    return typeof msg === 'string' ? msg : fallback;
  }
  return fallback;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/api/auth/login', { email, password });
        const { token, user } = res.data as { token: string; user: { role: 'user' | 'admin' } };
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        onLogin(token, user.role);
      } else {
        const res = await api.post('/api/auth/register', { name, email, password });
        const { token, user } = res.data as { token: string; user: { role: 'user' | 'admin' } };
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        onLogin(token, user.role);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 mt-20">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6 text-center">
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700">Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-400 text-neutral-900 font-semibold py-2 hover:bg-amber-300 transition disabled:opacity-60"
        >
          {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Login' : 'Register')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={switchMode}
          className="text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4"
          type="button"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}
