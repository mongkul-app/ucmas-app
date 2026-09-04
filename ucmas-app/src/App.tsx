import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LevelHome from './pages/LevelHome';
import Practice from './pages/Practice';
import Results from './pages/Results';
import History from './pages/History';
import Settings from './pages/Settings';
import Worksheet from './pages/Worksheet';
import { seedDemoDataIfEmpty, getSettings } from './utils/storage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    seedDemoDataIfEmpty();
    const settings = getSettings();
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/level/:levelId" element={<LevelHome />} />
            <Route path="/level/:levelId/practice" element={<Practice mode="practice" />} />
            <Route path="/level/:levelId/timed-test" element={<Practice mode="timed-test" />} />
            <Route path="/level/:levelId/speed-training" element={<Practice mode="speed-training" />} />
            <Route path="/level/:levelId/random-challenge" element={<Practice mode="random-challenge" />} />
            <Route path="/level/:levelId/mental-arithmetic" element={<Practice mode="mental-arithmetic" />} />
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
