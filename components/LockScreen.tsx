import React, { useState } from 'react';
import { unlock } from '../services/apiFetch';

// Shown while the server has APP_PASSCODE set and this browser hasn't entered it yet.
export const LockScreen: React.FC<{ onUnlocked: () => void }> = ({ onUnlocked }) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await unlock(code.trim());
      onUnlocked();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm p-6 rounded-2xl bg-white border border-marian-100 shadow-sm space-y-4">
        <div className="text-center">
          <img src="/icon.svg" alt="" className="w-12 h-12 mx-auto mb-2" />
          <h1 className="font-serif text-3xl text-marian-800">Rosa Maria</h1>
          <p className="text-sm text-gray-600">Private for now. Enter the passcode to continue.</p>
        </div>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          autoFocus
          autoComplete="current-password"
          className="w-full bg-white border border-marian-200 rounded-lg px-4 py-2 text-ink focus:ring-2 focus:ring-marian-500"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full bg-marian-700 hover:bg-marian-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
};
