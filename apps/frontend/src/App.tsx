import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { CatalogPage } from './pages/CatalogPage';
import { SavedExperimentsPage } from './pages/SavedExperimentsPage';
import { ClassroomsPage } from './pages/ClassroomsPage';
import { AdminConsolePage } from './pages/AdminConsolePage';
import { SharedExperimentPage } from './pages/SharedExperimentPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { EXPERIMENT_REGISTRY } from './experiments/registry';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (import.meta.env.DEV === true && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
    return <>{children}</>;
  }

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

const activeExperimentRoutes = EXPERIMENT_REGISTRY
  .filter((entry) => entry.available && entry.load)
  .map((entry) => ({
    id: entry.id,
    path: entry.path || `/experiments/${entry.id}`,
    Component: React.lazy(entry.load!),
    wrapperStyle: entry.wrapperStyle,
  }));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/share/:token" element={<SharedExperimentPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CatalogPage />} />
        <Route path="saved" element={<SavedExperimentsPage />} />
        <Route path="classrooms" element={<ClassroomsPage />} />
        <Route path="admin" element={<AdminConsolePage />} />
      </Route>
      {activeExperimentRoutes.map(({ id, path, Component, wrapperStyle }) => (
        <Route
          key={id}
          path={path}
          element={
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-primary)' }}>
                    <span className="spinner" style={{ width: '36px', height: '36px' }} />
                  </div>
                }
              >
                <div style={wrapperStyle ?? { minHeight: '100vh', background: 'var(--surface-primary)' }}>
                  <Component />
                </div>
              </Suspense>
            </ProtectedRoute>
          }
        />
      ))}
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
