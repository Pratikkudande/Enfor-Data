import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DashboardStats, Appointment } from '../types';
import { apiClient } from '../services/api';
import { getSubscriptionStatus } from '../services/subscriptionApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  dashboardStats?: DashboardStats | null;
  appointments?: Appointment[] | null;
  appointmentStats?: any;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  // Payment gate: null = unknown/checking, true = paid subscription active, false = unpaid
  subscriptionPaid: boolean | null;
  refreshSubscription: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<any | null>(null);
  const [subscriptionPaid, setSubscriptionPaid] = useState<boolean | null>(null);

  // Fetches the user's subscription status to drive the payment gate.
  const refreshSubscription = async (): Promise<void> => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionPaid(!!status.is_paid);
    } catch {
      setSubscriptionPaid(false);
    }
  };

  // Whenever the authenticated user changes, (re)check their payment status.
  // Admins bypass the subscription gate entirely.
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setSubscriptionPaid(true);
      } else {
        refreshSubscription();
      }
    } else {
      setSubscriptionPaid(null);
    }
  }, [user]);

  useEffect(() => {
    // Check for existing session and validate token
    const checkAuth = async () => {
      const token = localStorage.getItem('enfor_token');
      // A "payment pending" token belongs to a just-registered, unpaid user —
      // it's only for the checkout API, so don't auto-authenticate them.
      const paymentPending = localStorage.getItem('enfor_payment_pending') === 'true';
      if (token && !paymentPending) {
        try {
          const response = await apiClient.getMe();
          if (response.data) {
            const userData: User = {
              id: response.data.id,
              email: response.data.email,
              name: response.data.name || `${response.data.first_name} ${response.data.last_name}`,
              first_name: response.data.first_name,
              last_name: response.data.last_name,
              phone: response.data.phone || response.data.whatsapp_number || '',
              whatsapp_number: response.data.whatsapp_number,
              role: response.data.role as 'broker' | 'channel_partner' | 'admin',
              city: response.data.city,
              state: response.data.state,
              address: response.data.address,
              bio: response.data.bio,
              company_name: response.data.company_name || response.data.firm_name,
              firm_name: response.data.firm_name,
              profile_image: response.data.profile_image || undefined,
              is_verified: response.data.is_verified,
              years_experience: response.data.years_experience,
              deals_completed: response.data.deals_completed,
              specializations: response.data.specializations,
              created_at: response.data.created_at,
              updated_at: response.data.updated_at || response.data.created_at,
            };
            setUser(userData);
            localStorage.setItem('enfor_user', JSON.stringify(userData));
            // No eager dashboard prefetch here — each page fetches its own data
            // on mount, so a refresh only hits /auth/me (+ the page's endpoints).
            setLoading(false);
            return;
          }
        } catch (error) {
          try {
            const refreshResponse = await apiClient.refresh();
            if (refreshResponse.data) {
              localStorage.setItem('enfor_token', refreshResponse.data.token);
              localStorage.setItem('enfor_refresh_token', refreshResponse.data.refresh_token);

              const meResponse = await apiClient.getMe();
              if (meResponse.data) {
                const userData: User = {
                  id: meResponse.data.id,
                  email: meResponse.data.email,
                  name: meResponse.data.name || `${meResponse.data.first_name} ${meResponse.data.last_name}`,
                  first_name: meResponse.data.first_name,
                  last_name: meResponse.data.last_name,
                  phone: meResponse.data.phone || meResponse.data.whatsapp_number || '',
                  whatsapp_number: meResponse.data.whatsapp_number,
                  role: meResponse.data.role as 'broker' | 'channel_partner' | 'admin',
                  city: meResponse.data.city,
                  state: meResponse.data.state,
                  address: meResponse.data.address,
                  bio: meResponse.data.bio,
                  company_name: meResponse.data.company_name || meResponse.data.firm_name,
                  firm_name: meResponse.data.firm_name,
                  profile_image: meResponse.data.profile_image,
                  is_verified: meResponse.data.is_verified,
                  years_experience: meResponse.data.years_experience,
                  deals_completed: meResponse.data.deals_completed,
                  specializations: meResponse.data.specializations,
                  created_at: meResponse.data.created_at,
                  updated_at: meResponse.data.updated_at || meResponse.data.created_at,
                };
                setUser(userData);
                localStorage.setItem('enfor_user', JSON.stringify(userData));
                setLoading(false);
                return;
              }
            }
          } catch (refreshError) {
            console.warn('Session refresh failed:', refreshError);
          }
          localStorage.removeItem('enfor_token');
          localStorage.removeItem('enfor_refresh_token');
          localStorage.removeItem('enfor_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.data) {
        // Valid credentials but no active subscription: keep the token only so
        // the user can pay, but do NOT log them in. Signal the caller to route
        // them to the pricing page.
        if (response.data.requires_payment) {
          localStorage.setItem('enfor_token', response.data.token);
          localStorage.setItem('enfor_refresh_token', response.data.refresh_token);
          localStorage.setItem('enfor_payment_pending', 'true');
          localStorage.setItem('enfor_pending_role', response.data.user?.role || '');
          localStorage.removeItem('enfor_user');
          const e: any = new Error('no_subscription');
          e.code = 'no_subscription';
          throw e;
        }

        // Store tokens (a successful login means the account is paid).
        localStorage.setItem('enfor_token', response.data.token);
        localStorage.setItem('enfor_refresh_token', response.data.refresh_token);
        localStorage.removeItem('enfor_payment_pending');
        localStorage.removeItem('enfor_pending_role');

        // Create user object
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || `${response.data.user.first_name} ${response.data.user.last_name}`,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          phone: response.data.user.phone || response.data.user.whatsapp_number || '',
          whatsapp_number: response.data.user.whatsapp_number,
          role: response.data.user.role as 'broker' | 'channel_partner' | 'admin',
          city: response.data.user.city,
          state: response.data.user.state,
          address: response.data.user.address,
          bio: response.data.user.bio,
          company_name: response.data.user.company_name || response.data.user.firm_name,
          firm_name: response.data.user.firm_name,
          profile_image: response.data.user.profile_image,
          is_verified: response.data.user.is_verified,
          years_experience: response.data.user.years_experience,
          deals_completed: response.data.user.deals_completed,
          specializations: response.data.user.specializations,
          created_at: response.data.user.created_at,
          updated_at: response.data.user.updated_at || response.data.user.created_at
        };
        
        setUser(userData);
        localStorage.setItem('enfor_user', JSON.stringify(userData));
        // No eager dashboard prefetch — the dashboard fetches its own
        // lightweight stats on mount, so login only signs the user in.
        return userData.role;
      }
      return 'broker';
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('enfor_token');
      localStorage.removeItem('enfor_refresh_token');
      localStorage.removeItem('enfor_user');
      localStorage.removeItem('enfor_payment_pending');
      localStorage.removeItem('enfor_pending_role');
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      const response = await apiClient.signup(userData);

      if (response.data) {
        // A new account has no subscription yet, so we do NOT log the user in.
        // We only keep the token so they can pay on the checkout page. The user
        // stays unauthenticated (no dashboard access, no data prefetch) until
        // they pay and log in. The token is marked as "payment pending" so a
        // page reload doesn't auto-authenticate them before payment.
        localStorage.setItem('enfor_token', response.data.token);
        localStorage.setItem('enfor_refresh_token', response.data.refresh_token);
        localStorage.setItem('enfor_payment_pending', 'true');
        localStorage.setItem('enfor_pending_role', response.data.user?.role || '');
        localStorage.removeItem('enfor_user');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.getMe();
      if (response.data) {
        const userData: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name || `${response.data.first_name} ${response.data.last_name}`,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          phone: response.data.phone || response.data.whatsapp_number || '',
          whatsapp_number: response.data.whatsapp_number,
          role: response.data.role as 'broker' | 'channel_partner' | 'admin',
          city: response.data.city,
          state: response.data.state,
          address: response.data.address,
          bio: response.data.bio,
          company_name: response.data.company_name || response.data.firm_name,
          firm_name: response.data.firm_name,
          profile_image: response.data.profile_image || undefined,
          is_verified: response.data.is_verified,
          years_experience: response.data.years_experience,
          deals_completed: response.data.deals_completed,
          specializations: response.data.specializations,
          created_at: response.data.created_at,
          updated_at: response.data.updated_at || response.data.created_at,
        };
        setUser(userData);
        localStorage.setItem('enfor_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    dashboardStats,
    appointments,
    appointmentStats,
    login,
    logout,
    register,
    refreshUser,
    subscriptionPaid,
    refreshSubscription,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};