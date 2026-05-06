import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationApi, Notification, NotificationStats } from '../services/notificationApi';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load unread notifications for the dropdown
      const unreadResponse = await notificationApi.getUnreadNotifications();
      if (unreadResponse.success && unreadResponse.data) {
        setNotifications(unreadResponse.data);
      }

      // Load stats for the counter
      const statsResponse = await notificationApi.getNotificationStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
        setUnreadCount(statsResponse.data.unread);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial notifications and stats
  useEffect(() => {
    refreshNotifications();
    
    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(refreshNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update stats
      setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Update stats
      setStats(prev => prev ? { ...prev, unread: 0 } : null);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const filteredNotifications = prev.filter(n => n.id !== notificationId);
        
        // Update unread count if the deleted notification was unread
        if (notification && !notification.read) {
          setUnreadCount(current => Math.max(0, current - 1));
        }
        
        // Update stats
        setStats(currentStats => {
          if (!currentStats) return null;
          
          const newStats = { ...currentStats };
          newStats.total = Math.max(0, newStats.total - 1);
          
          if (notification && !notification.read) {
            newStats.unread = Math.max(0, newStats.unread - 1);
          }
          
          if (notification) {
            newStats.by_type[notification.type] = Math.max(0, newStats.by_type[notification.type] - 1);
          }
          
          return newStats;
        });
        
        return filteredNotifications;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, []);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Update stats
    setStats(prev => {
      if (!prev) return null;
      
      const newStats = { ...prev };
      newStats.total += 1;
      
      if (!newNotification.read) {
        newStats.unread += 1;
      }
      
      newStats.by_type[newNotification.type] += 1;
      
      return newStats;
    });
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    stats,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};