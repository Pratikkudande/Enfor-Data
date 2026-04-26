import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DashboardStats, Appointment } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  dashboardStats?: DashboardStats | null;
  appointments?: Appointment[] | null;
  appointmentStats?: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
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

  useEffect(() => {
    // Check for existing session and validate token
    const checkAuth = async () => {
      const token = localStorage.getItem('enfor_token');
      if (token) {
        try {
          const response = await apiClient.getMe();
          if (response.data) {
            const userData: User = {
              id: response.data.id,
              email: response.data.email,
              name: `${response.data.first_name} ${response.data.last_name}`,
              phone: '',
              role: response.data.role as 'broker' | 'channel_partner' | 'admin',
              city: response.data.city,
              state: response.data.state,
              company_name: response.data.firm_name,
              is_verified: response.data.is_verified,
              created_at: response.data.created_at,
              updated_at: response.data.created_at,
            };
            setUser(userData);
            localStorage.setItem('enfor_user', JSON.stringify(userData));
            // Prefetch dashboard stats for immediate availability in UI
            try {
              const [propsRes, clientsRes, apptRes, apptsRes] = await Promise.all([
                  apiClient.getAllProperties(),
                  apiClient.getClients(),
                  apiClient.getAppointmentStats(),
                  apiClient.getAppointments(),
                ]);

              const properties = propsRes?.data ?? [];
              const clients = clientsRes?.data ?? [];
              const apptStats = apptRes?.data ?? apptRes ?? {};
              const appts = apptsRes?.data ?? apptsRes ?? [];

              const derived: DashboardStats = {
                totalProperties: Array.isArray(properties) ? properties.length : 0,
                activeProperties: Array.isArray(properties) ? properties.filter((p: any) => p.status === 'available').length : 0,
                totalClients: Array.isArray(clients) ? clients.length : 0,
                userClientsCount: Array.isArray(clients) ? clients.length : 0,
                totalAppointments: apptStats?.total ?? 0,
                todaysAppointments: apptStats?.today ?? 0,
                whatsappMessagesCount: 0,
                remainingMessages: 0,
                clientsByType: {
                  buyers: 0,
                  sellers: 0,
                  tenants: 0,
                  owners: 0,
                },
                propertiesByStatus: {
                  available: Array.isArray(properties) ? properties.filter((p: any) => p.status === 'available').length : 0,
                  sold: 0,
                  rented: 0,
                  under_negotiation: 0,
                },
              };

              setDashboardStats(derived);
              setAppointments(Array.isArray(appts) ? appts : []);
              setAppointmentStats(apptStats);
            } catch (e) {
              // ignore prefetch errors — dashboard will fetch on demand
            }
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
                  name: `${meResponse.data.first_name} ${meResponse.data.last_name}`,
                  phone: '',
                  role: meResponse.data.role as 'broker' | 'channel_partner' | 'admin',
                  city: meResponse.data.city,
                  state: meResponse.data.state,
                  company_name: meResponse.data.firm_name,
                  is_verified: meResponse.data.is_verified,
                  created_at: meResponse.data.created_at,
                  updated_at: meResponse.data.created_at,
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

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.data) {
        // Store tokens
        localStorage.setItem('enfor_token', response.data.token);
        localStorage.setItem('enfor_refresh_token', response.data.refresh_token);
        
        // Create user object
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.first_name} ${response.data.user.last_name}`,
          phone: '',
          role: response.data.user.role as 'broker' | 'channel_partner' | 'admin',
          city: response.data.user.city,
          state: response.data.user.state,
          company_name: response.data.user.firm_name,
          is_verified: response.data.user.is_verified,
          created_at: response.data.user.created_at,
          updated_at: response.data.user.created_at
        };
        
        setUser(userData);
        localStorage.setItem('enfor_user', JSON.stringify(userData));
        // Prefetch dashboard stats immediately after login
        try {
          const [propsRes, clientsRes, apptRes, apptsRes] = await Promise.all([
            apiClient.getAllProperties(),
            apiClient.getClients(),
            apiClient.getAppointmentStats(),
            apiClient.getAppointments(),
          ]);

          const properties = propsRes?.data ?? [];
          const clients = clientsRes?.data ?? [];
          const apptStats = apptRes?.data ?? apptRes ?? {};
          const appts = apptsRes?.data ?? apptsRes ?? [];

          const derived: DashboardStats = {
            totalProperties: Array.isArray(properties) ? properties.length : 0,
            activeProperties: Array.isArray(properties) ? properties.filter((p: any) => p.status === 'available').length : 0,
            totalClients: Array.isArray(clients) ? clients.length : 0,
            userClientsCount: Array.isArray(clients) ? clients.length : 0,
            totalAppointments: apptStats?.total ?? 0,
            todaysAppointments: apptStats?.today ?? 0,
            whatsappMessagesCount: 0,
            remainingMessages: 0,
            clientsByType: {
              buyers: 0,
              sellers: 0,
              tenants: 0,
              owners: 0,
            },
            propertiesByStatus: {
              available: Array.isArray(properties) ? properties.filter((p: any) => p.status === 'available').length : 0,
              sold: 0,
              rented: 0,
              under_negotiation: 0,
            },
          };

          setDashboardStats(derived);
          setAppointments(Array.isArray(appts) ? appts : []);
          setAppointmentStats(apptStats);
        } catch (e) {
          // ignore
        }
      }
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
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      const response = await apiClient.signup(userData);
      
      if (response.data) {
        // Store tokens
        localStorage.setItem('enfor_token', response.data.token);
        localStorage.setItem('enfor_refresh_token', response.data.refresh_token);
        
        // Create user object
        const newUser: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.first_name} ${response.data.user.last_name}`,
          phone: '',
          role: response.data.user.role as 'broker' | 'channel_partner' | 'admin',
          city: response.data.user.city,
          state: response.data.user.state,
          company_name: response.data.user.firm_name,
          is_verified: response.data.user.is_verified,
          created_at: response.data.user.created_at,
          updated_at: response.data.user.created_at
        };
        
        setUser(newUser);
        localStorage.setItem('enfor_user', JSON.stringify(newUser));
        // Prefetch dashboard stats after registration
        try {
          const [propsRes, clientsRes, apptRes, apptsRes] = await Promise.all([
            apiClient.getAllProperties(),
            apiClient.getClients(),
            apiClient.getAppointmentStats(),
            apiClient.getAppointments(),
          ]);

          const properties = propsRes?.data ?? [];
          const clients = clientsRes?.data ?? [];
          const apptStats = apptRes?.data ?? apptRes ?? {};
          const appts = apptsRes?.data ?? apptsRes ?? [];

          const derived: DashboardStats = {
            totalProperties: Array.isArray(properties) ? properties.length : 0,
            activeProperties: Array.isArray(properties) ? properties.filter((p: any) => p.status === 'available').length : 0,
            totalClients: Array.isArray(clients) ? clients.length : 0,
            userClientsCount: Array.isArray(clients) ? clients.length : 0,
            totalAppointments: apptStats?.total ?? 0,
            todaysAppointments: apptStats?.today ?? 0,
            whatsappMessagesCount: 0,
            remainingMessages: 0,
            clientsByType: {
              buyers: 0,
              sellers: 0,
              tenants: 0,
              owners: 0,
            },
            propertiesByStatus: {
              available: Array.isArray(properties) ? properties.filter((p: any) => p.status === 'available').length : 0,
              sold: 0,
              rented: 0,
              under_negotiation: 0,
            },
          };

          setDashboardStats(derived);
          setAppointments(Array.isArray(appts) ? appts : []);
          setAppointmentStats(apptStats);
        } catch (e) {
          // ignore
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};