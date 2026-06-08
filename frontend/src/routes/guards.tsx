import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from './routePaths';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ENFOR DATA...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading ENFOR DATA...</p>
    </div>
  </div>
);

// Requires an authenticated user with an active *paid* subscription.
// Unpaid users are funneled to the pricing page to choose a plan and pay.
export const RequirePaidRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, subscriptionPaid } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Subscription status still being fetched.
  if (subscriptionPaid === null) return <FullScreenLoader />;

  if (!subscriptionPaid) {
    return <Navigate to={ROUTES.PRICING} replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

// Allows access to the checkout flow for either a logged-in user OR a
// just-registered user who has a "payment pending" token but isn't logged in yet.
export const RequireCheckoutAccess: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  const hasToken = !!localStorage.getItem('enfor_token');
  if (!isAuthenticated && !hasToken) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading, subscriptionPaid } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (isAuthenticated) {
    // Admin users always go to admin dashboard
    if (user?.role === 'admin') {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
    // Still checking payment status — wait before deciding.
    if (subscriptionPaid === null) return <FullScreenLoader />;
    // Only paid users get pushed straight into the app.
    if (subscriptionPaid) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }

  return <>{children}</>;
};
