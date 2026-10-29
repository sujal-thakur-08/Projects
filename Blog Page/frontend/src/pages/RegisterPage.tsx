import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({ name, username, email, password });
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Registration failed. Username or email may already be taken.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-84px)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl gap-8 rounded-[2rem] border border-white/40 bg-white/70 p-6 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          <div>
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started with authoring, comments, and AI tools.</p>
          </div>
          <label className="block space-y-2 text-sm font-medium">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="input-shell" placeholder="Your name" />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="input-shell" placeholder="your-handle" />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="input-shell" placeholder="you@example.com" />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="input-shell" placeholder="At least 8 characters" />
          </label>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account? <Link to="/login" className="font-medium text-sky-600 dark:text-sky-300">Login</Link>
          </p>
        </form>
        <div className="rounded-[1.75rem] bg-hero-radial p-8 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Built for publishing teams</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Multi-author workflows with AI support and moderation tools.</h1>
          <p className="mt-4 max-w-md text-white/80">Publish drafts, let the AI assistant summarize your articles, and keep a clean editorial inbox across comments and bookmarks.</p>
        </div>
      </div>
    </div>
  );
}