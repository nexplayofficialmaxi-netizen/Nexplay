import {useEffect, useState, type FormEvent} from 'react';
import {LogIn, LogOut, UserCheck, UserPlus, X} from 'lucide-react';
import type {LocalizedContent} from '../data/nexplayData';

export interface PortalAuthUser {
  id: string;
  username: string;
}

interface PortalAuthModalProps {
  open: boolean;
  onClose: () => void;
  user: PortalAuthUser | null;
  onAuthSuccess: (token: string, user: PortalAuthUser) => void;
  onLogout: () => void;
  copy: LocalizedContent['auth'];
}

export function PortalAuthModal({
  open,
  onClose,
  user,
  onAuthSuccess,
  onLogout,
  copy,
}: PortalAuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (cleanUser.length < 2 || password.length < 4) {
      setError(copy.errShort);
      return;
    }
    if (tab === 'register' && password !== confirmPassword) {
      setError(copy.errMismatch);
      return;
    }

    setBusy(true);
    try {
      const endpoint =
        tab === 'register' ? '/api/portal/auth/register' : '/api/portal/auth/login';
      const body =
        tab === 'register'
          ? {username: cleanUser, password, confirmPassword}
          : {username: cleanUser, password};
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || copy.errNetwork);
        return;
      }
      setPassword('');
      setConfirmPassword('');
      onAuthSuccess(data.token, data.user);
      onClose();
    } catch {
      setError(copy.errNetwork);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-auth-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11161E] p-6 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--accent-text)]">{copy.optionalBadge}</p>
            <h2
              id="portal-auth-title"
              className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white"
            >
              {user ? copy.titleSignedIn : copy.titleSignedOut}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg border border-slate-200 dark:border-white/10 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {user ? copy.subtitleSignedIn : copy.subtitleSignedOut}
        </p>

        {user ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-[var(--accent-text)] shrink-0" />
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{copy.signedInAs}</p>
                <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {copy.logoutButton}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div
              role="tablist"
              className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#090C11] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  tab === 'login'
                    ? 'bg-[var(--accent-main)] text-[var(--accent-on)]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {copy.loginTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  tab === 'register'
                    ? 'bg-[var(--accent-main)] text-[var(--accent-on)]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {copy.registerTab}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="portal-auth-username"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {copy.usernameLabel}
                </label>
                <input
                  id="portal-auth-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={copy.usernamePlaceholder}
                  autoComplete="username"
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--accent-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                />
              </div>

              <div>
                <label
                  htmlFor="portal-auth-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {copy.passwordLabel}
                </label>
                <input
                  id="portal-auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--accent-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                />
              </div>

              {tab === 'register' && (
                <div>
                  <label
                    htmlFor="portal-auth-confirm"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {copy.confirmPasswordLabel}
                  </label>
                  <input
                    id="portal-auth-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={copy.confirmPasswordPlaceholder}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090C11] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[var(--accent-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 dark:border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {copy.continueGuest}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-on)] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {tab === 'register' ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {tab === 'register' ? copy.registerSubmit : copy.loginSubmit}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
