import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';

import routes from './routes';

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
      <IntersectObserver />
      {isLoginPage ? (
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      ) : (
        <MainLayout>
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
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
