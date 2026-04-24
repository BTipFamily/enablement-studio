import React, { createContext, useState, useContext, useEffect } from 'react';

const STORAGE_KEY = 'app_authenticated';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem(STORAGE_KEY) === 'true');
    setIsLoadingAuth(false);
  }, []);

  const login = (password) => {
    if (password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user: isAuthenticated ? { role: 'user' } : null,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      login,
      logout,
      navigateToLogin: () => {},
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
