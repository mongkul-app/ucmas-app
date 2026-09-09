import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LevelHome from './pages/LevelHome';
import Practice from './pages/Practice';
import FlashPractice from './pages/FlashPractice';
import Results from './pages/Results';
import History from './pages/History';
import Settings from './pages/Settings';
import Worksheet from './pages/Worksheet';
import Login from './pages/Login';
import { seedDemoDataIfEmpty, getSettings, syncFromSupabase, clearLocalIdentity } from './utils/storage';
import { useAuth } from './hooks/useAuth';
import { isSupabaseConfigured } from './lib/supabaseClient';

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-600" size={28} />
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { session, loading } = useAuth();
  const [synced, setSynced] = useState(!isSupabaseConfigured);
  const syncedUserIdRef = useRef<string | null>(null);

  // One-time setup: dark mode preference, and local demo data when there's
  // no login system at all (Supabase not configured yet).
  useEffect(() => {
    const settings = getSettings();
    document.documentElement.classList.toggle('dark', settings.darkMode);
    if (!isSupabaseConfigured) {
      seedDemoDataIfEmpty();
    }
  }, []);

  // Pull an account's data down from Supabase right after sign-in, and reset
  // back to a clean local demo state right after sign-out.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (session) {
      if (syncedUserIdRef.current === session.user.id) return;
      syncedUserIdRef.current = session.user.id;
      setSynced(false);
      const fallbackName =
        (session.user.user_metadata?.full_name as string | undefined) || session.user.email || 'Student';
      syncFromSupabase(session.user.id, fallbackName).finally(() => setSynced(true));
    } else {
      if (syncedUserIdRef.current !== null) {
        clearLocalIdentity();
        seedDemoDataIfEmpty();
      }
      syncedUserIdRef.current = null;
      setSynced(true);
    }
  }, [session]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isSupabaseConfigured && loading) {
    return <FullPageLoader />;
  }

  if (isSupabaseConfigured && !session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (isSupabaseConfigured && !synced) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-screen">
      <div className="no-print contents">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/level/:levelId" element={<LevelHome />} />
            <Route path="/level/:levelId/practice" element={<Practice mode="practice" />} />
            <Route path="/level/:levelId/timed-test" element={<Practice mode="timed-test" />} />
            <Route path="/level/:levelId/speed-training" element={<Practice mode="speed-training" />} />
            <Route path="/level/:levelId/random-challenge" element={<Practice mode="random-challenge" />} />
            <Route path="/level/:levelId/mental-arithmetic" element={<Practice mode="mental-arithmetic" />} />
            <Route path="/level/:levelId/flash" element={<FlashPractice />} />
            <Route path="/level/:levelId/worksheet" element={<Worksheet />} />
            <Route path="/results" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
