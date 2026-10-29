import { FormEvent, useState } from 'react';

import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api.put('/auth/me/password', { current_password: currentPassword, new_password: newPassword });
    setMessage('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <section className="glass-panel rounded-[2rem] p-6">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Security and session controls.</p>
          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>Current password</span>
              <input className="input-shell" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>New password</span>
              <input className="input-shell" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}
            <button type="submit" className="btn-primary">Update password</button>
          </form>
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold">Session</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Clear local session data and return to the public site.</p>
          <button type="button" onClick={logout} className="btn-secondary mt-4">Logout</button>
        </section>
      </div>
    </div>
  );
}