import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { OhmsLaw } from './experiments/ohmsLaw/OhmsLaw';
import { Creep } from './experiments/creep/Creep';
import { SolarCellCharacteristics } from './experiments/solarCell/SolarCellCharacteristics';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
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
        path="/experiments/creep"
        element={
          <ProtectedRoute>
            <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
              <Creep />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/experiments/solar-cell-characteristics"
        element={
          <ProtectedRoute>
            <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
              <SolarCellCharacteristics />
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
