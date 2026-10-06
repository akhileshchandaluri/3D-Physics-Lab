import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { OhmsLaw } from './experiments/ohmsLaw/OhmsLaw';
import { CreepConstant } from './experiments/creepConstant/CreepConstant';

import { SharedExperimentPage } from './pages/SharedExperimentPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-primary)' }}>
        <span className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/share/:token" element={<SharedExperimentPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/experiments/ohms-law"
        element={
          <ProtectedRoute>
            <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
              <OhmsLaw />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/experiments/creep-constant"
        element={
          <ProtectedRoute>
            <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
              <CreepConstant />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
