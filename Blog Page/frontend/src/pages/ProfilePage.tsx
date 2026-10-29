import { FormEvent, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateUser({ name, username, bio, avatar_url: avatarUrl });
    setMessage('Profile updated successfully.');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[2rem] p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Update your public author identity.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            <span>Name</span>
            <input className="input-shell" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Username</span>
            <input className="input-shell" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Bio</span>
            <textarea className="input-shell min-h-[140px]" value={bio} onChange={(event) => setBio(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Avatar URL</span>
            <input className="input-shell" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          </label>
          {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}
          <button type="submit" className="btn-primary">Save profile</button>
        </form>
      </div>
    </div>
  );
}