import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Calculator, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth, signUpWithEmail, signInWithEmail, signInWithGoogle } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Login() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!isSupabaseConfigured) {
    // No Supabase env vars configured — accounts aren't available yet, just
    // continue straight into the local-only app instead of blocking anyone.
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name || 'Student');
        setConfirmSent(true);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-3">
            <Calculator size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">UCMAS Trainer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Mental Math Practice</p>
        </div>

        <div className="card p-6">
          {confirmSent ? (
            <div className="text-center py-4">
              <p className="font-bold text-slate-800 dark:text-slate-100">Check your email</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                We sent a confirmation link to <span className="font-semibold">{email}</span>. Confirm it, then sign in.
              </p>
              <button onClick={() => { setConfirmSent(false); setMode('signin'); }} className="btn-secondary mt-4 text-sm">
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="flex rounded-xl bg-slate-100 dark:bg-navy-700 p-1 mb-5">
                <button
                  onClick={() => setMode('signin')}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                    mode === 'signin' ? 'bg-white dark:bg-navy-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                    mode === 'signup' ? 'bg-white dark:bg-navy-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-slate-200 dark:border-navy-700 py-2.5 font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-slate-200 dark:bg-navy-700 flex-1" />
                <span className="text-xs text-slate-400">or</span>
                <div className="h-px bg-slate-200 dark:bg-navy-700 flex-1" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 pl-9 pr-3 py-2.5 text-sm"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 pl-9 pr-3 py-2.5 text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 pl-9 pr-3 py-2.5 text-sm"
                  />
                </div>

                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

                <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.36 0-4.36-1.6-5.07-3.74H.9v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 0 1 3.65 9c0-.58.1-1.15.28-1.68V4.99H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.01l3.03-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.99l3.03 2.33C4.64 5.18 6.64 3.58 9 3.58z" />
    </svg>
  );
}
