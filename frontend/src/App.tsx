import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AppRoutes } from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ErrorBoundary>
            <NotificationProvider>
              <ErrorBoundary>
                <ToastProvider>
                  <AppRoutes />
                </ToastProvider>
              </ErrorBoundary>
            </NotificationProvider>
          </ErrorBoundary>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;