import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Standards from '@/pages/Standards';
import ActivityCatalogue from '@/pages/ActivityCatalogue';
import BuildWizard from '@/pages/BuildWizard';
import Workspace from '@/pages/Workspace';
import Documentation from '@/pages/Documentation';
import Validator from '@/pages/Validator';
import { hasProfile, saveProfile } from '@/lib/user-profile';

// ─── User Profile Modal ───────────────────────────────────────────────────────

const TEAM_SUGGESTIONS = [
  "Platform Engineering", "Linux Operations", "Windows Operations", "Network Engineering",
  "Database Administration", "Middleware", "Observability", "Security", "Cloud Infrastructure",
  "Storage", "Mainframe", "Big Data", "DevOps", "Automation CoE",
];

function UserProfileModal({ onSave }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");

  const filtered = TEAM_SUGGESTIONS.filter(t =>
    team.length > 0 && t.toLowerCase().includes(team.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    onSave({ name: name.trim(), team: team.trim() });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Who are you?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your name and team are tagged on every automation you build, so the Dashboard can
            track who is creating value.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Your name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Alex Chen"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100"
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Team <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={team}
              onChange={e => { setTeam(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. Platform Engineering"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100"
            />
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {filtered.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTeam(t); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Save & Continue
            </button>
            <button
              type="button"
              onClick={() => onSave({ name: "Anonymous", team: "" })}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Password Form ────────────────────────────────────────────────────────────

const PasswordForm = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onLogin(password)) setError('Incorrect password');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">Enablement Studio</h1>
        <p className="text-sm text-slate-500 mb-6">Enter the access password to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Password"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Authenticated App ────────────────────────────────────────────────────────

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, login } = useAuth();
  const [profileDone, setProfileDone] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setProfileDone(hasProfile());
    }
  }, [isAuthenticated]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordForm onLogin={login} />;
  }

  if (!profileDone) {
    return (
      <UserProfileModal
        onSave={(data) => {
          saveProfile(data);
          setProfileDone(true);
        }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Standards" element={<Standards />} />
        <Route path="/ActivityCatalogue" element={<ActivityCatalogue />} />
        <Route path="/BuildWizard" element={<BuildWizard />} />
        <Route path="/Workspace" element={<Workspace />} />
        <Route path="/Validator" element={<Validator />} />
        <Route path="/Documentation" element={<Documentation />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
