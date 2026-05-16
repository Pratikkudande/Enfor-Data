import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routePaths';
import { ProtectedRoute, PublicRoute } from './guards';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Direct Imports for smaller bundles
import LandingPage from '../pages/Landing/LandingPage';
import LoginForm from '../pages/Auth/LoginForm';
import RegisterForm from '../pages/Auth/RegisterForm';

// Lazy loading for large feature pages
const BrokerDashboard = lazy(() => import('../pages/Dashboard/BrokerDashboard'));
const PropertiesView = lazy(() => import('../pages/Properties/PropertiesView'));
const WhatsAppView = lazy(() => import('../pages/WhatsApp/WhatsAppView'));
const SMSMarketingView = lazy(() => import('../pages/SMSMarketing/SMSMarketingView'));
const ClientsView = lazy(() => import('../pages/Clients/ClientsView'));
const AppointmentsView = lazy(() => import('../pages/Appointments/AppointmentsView'));
const BrokerNetworkView = lazy(() => import('../pages/Network/BrokerNetworkView'));
const BusinessPostsView = lazy(() => import('../pages/BusinessPosts/BusinessPostsView'));
const MarketingView = lazy(() => import('../pages/Marketing/MarketingView'));
const AgreementsView = lazy(() => import('../pages/Agreements/AgreementsView'));
const ProjectsView = lazy(() => import('../pages/Projects/ProjectsView'));

// Profile & Settings Pages
const ProfileView = lazy(() => import('../pages/Profile/ProfileView'));
const SettingsView = lazy(() => import('../pages/Settings/SettingsView'));
const NotificationsView = lazy(() => import('../pages/Notifications/NotificationsView'));

// Subscription Pages
const PricingPage = lazy(() => import('../pages/Subscription/PricingPage'));
const ActivateTrialPage = lazy(() => import('../pages/Subscription/ActivateTrialPage'));
const SubscriptionDashboard = lazy(() => import('../pages/Subscription/SubscriptionDashboard'));
const CheckoutPage = lazy(() => import('../pages/Subscription/CheckoutPage'));
const SuccessPage = lazy(() => import('../pages/Subscription/SuccessPage'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);



export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.HOME} element={<PublicRoute><LandingPage /></PublicRoute>} />
      
      {/* Public Pricing Page */}
      <Route path={ROUTES.PRICING} element={
        <Suspense fallback={<PageLoader />}>
          <PricingPage />
        </Suspense>
      } />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginForm /></PublicRoute>} />
        <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterForm /></PublicRoute>} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path={ROUTES.DASHBOARD} element={
          <Suspense fallback={<PageLoader />}>
            <BrokerDashboard />
          </Suspense>
        } />
        <Route path={ROUTES.PROPERTIES} element={
          <Suspense fallback={<PageLoader />}>
            <PropertiesView />
          </Suspense>
        } />
        <Route path={ROUTES.WHATSAPP} element={
          <Suspense fallback={<PageLoader />}>
            <WhatsAppView />
          </Suspense>
        } />
        <Route path={ROUTES.SMS_MARKETING} element={
          <Suspense fallback={<PageLoader />}>
            <SMSMarketingView />
          </Suspense>
        } />
        <Route path={ROUTES.CLIENTS} element={
          <Suspense fallback={<PageLoader />}>
            <ClientsView />
          </Suspense>
        } />
        <Route path={ROUTES.APPOINTMENTS} element={
          <Suspense fallback={<PageLoader />}>
            <AppointmentsView />
          </Suspense>
        } />
        <Route path={ROUTES.NETWORK} element={
          <Suspense fallback={<PageLoader />}>
            <BrokerNetworkView />
          </Suspense>
        } />
        <Route path={ROUTES.BUSINESS_POSTS} element={
          <Suspense fallback={<PageLoader />}>
            <BusinessPostsView />
          </Suspense>
        } />
        <Route path={ROUTES.MARKETING} element={
          <Suspense fallback={<PageLoader />}>
            <MarketingView />
          </Suspense>
        } />
        <Route path={ROUTES.AGREEMENTS} element={
          <Suspense fallback={<PageLoader />}>
            <AgreementsView />
          </Suspense>
        } />
        <Route path={ROUTES.PROJECTS} element={
          <Suspense fallback={<PageLoader />}>
            <ProjectsView />
          </Suspense>
        } />
        
        {/* Profile & Settings Routes */}
        <Route path={ROUTES.PROFILE} element={
          <Suspense fallback={<PageLoader />}>
            <ProfileView />
          </Suspense>
        } />
        <Route path={ROUTES.SETTINGS} element={
          <Suspense fallback={<PageLoader />}>
            <SettingsView />
          </Suspense>
        } />
        <Route path={ROUTES.NOTIFICATIONS} element={
          <Suspense fallback={<PageLoader />}>
            <NotificationsView />
          </Suspense>
        } />
        
        {/* Subscription Routes - Protected */}
        <Route path={ROUTES.SUBSCRIPTION} element={
          <Suspense fallback={<PageLoader />}>
            <SubscriptionDashboard />
          </Suspense>
        } />
        <Route path={ROUTES.SUBSCRIPTION_ACTIVATE_TRIAL} element={
          <Suspense fallback={<PageLoader />}>
            <ActivateTrialPage />
          </Suspense>
        } />
        <Route path={ROUTES.SUBSCRIPTION_CHECKOUT} element={
          <Suspense fallback={<PageLoader />}>
            <CheckoutPage />
          </Suspense>
        } />
        <Route path={ROUTES.SUBSCRIPTION_SUCCESS} element={
          <Suspense fallback={<PageLoader />}>
            <SuccessPage />
          </Suspense>
        } />
        
        {/* Catch-all redirect to Dashboard if logged in */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>
    </Routes>
  );
};
