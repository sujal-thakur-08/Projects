import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const destination = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-84px)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl gap-8 rounded-[2rem] border border-white/40 bg-white/70 p-6 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div className="rounded-[1.75rem] bg-hero-radial p-8 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Welcome back</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Sign in to publish, bookmark, and moderate.</h1>
          <p className="mt-4 max-w-md text-white/80">Return to your dashboard, continue drafting with the AI assistant, and keep your blog moving.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          <div>
            <h2 className="text-2xl font-semibold">Login</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your registered account.</p>
          </div>
          <label className="block space-y-2 text-sm font-medium">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="input-shell" placeholder="you@example.com" />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="input-shell" placeholder="••••••••" />
          </label>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            New here? <Link to="/register" className="font-medium text-sky-600 dark:text-sky-300">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}