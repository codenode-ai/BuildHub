import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import routes from './routes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Toaster } from '@/components/ui/toaster';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      {isLoginPage ? (
        <ErrorBoundary>
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </ErrorBoundary>
      ) : (
        <MainLayout>
          <ErrorBoundary>
            <Routes>
              {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
            </Routes>
          </ErrorBoundary>
        </MainLayout>
      )}
      <Toaster />
    </>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <RouteGuard>
            <AppContent />
          </RouteGuard>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
