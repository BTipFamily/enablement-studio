import { useState } from "react";
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
import BuildWizard from '@/pages/BuildWizard';
import Workspace from '@/pages/Workspace';
import Documentation from '@/pages/Documentation';

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, login } = useAuth();

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

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Standards" element={<Standards />} />
        <Route path="/BuildWizard" element={<BuildWizard />} />
        <Route path="/Workspace" element={<Workspace />} />
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
