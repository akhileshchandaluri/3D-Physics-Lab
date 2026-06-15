import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MuiThemeProvider } from './context/MuiThemeProvider';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { OhmsLaw } from './experiments/ohmsLaw/OhmsLaw';
import { Creep } from './experiments/creep/Creep';
import { SolarCellCharacteristics } from './experiments/solarCell/SolarCellCharacteristics';
import { AmbientEnvironment, PageTransition } from './components/ui';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  
  // Initialize Lenis smooth scroll globally
  useSmoothScroll();

  return (
    <>
      <AmbientEnvironment />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/experiments/ohms-law"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
                    <OhmsLaw />
                  </div>
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/experiments/creep"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
                    <Creep />
                  </div>
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/experiments/solar-cell-characteristics"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <div style={{ minHeight: '100vh', background: 'var(--surface-primary)' }}>
                    <SolarCellCharacteristics />
                  </div>
                </PageTransition>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <MuiThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </MuiThemeProvider>
    </ThemeProvider>
  );
}

export default App;
