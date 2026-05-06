import { apiClient } from './apiClient';
import { ApiResponse } from '../types';
import { mockNotifications, mockNotificationStats } from './mockNotificationData';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'property' | 'client' | 'payment' | 'system' | 'marketing';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: {
    property_id?: string;
    client_id?: string;
    appointment_id?: string;
    amount?: number;
    [key: string]: any;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    appointment: number;
    property: number;
    client: number;
    payment: number;
    system: number;
    marketing: number;
  };
}

// Mock data storage for development
let mockNotificationData = [...mockNotifications];

class NotificationApiService {
  // Get all notifications
  async getNotifications(page = 1, limit = 20): Promise<ApiResponse<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  }>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = mockNotificationData.slice(startIndex, endIndex);
      
      return Promise.resolve({
        success: true,
        data: {
          notifications: paginatedNotifications,
          pagination: {
            page,
            limit,
            total: mockNotificationData.length,
            total_pages: Math.ceil(mockNotificationData.length / limit)
          }
        }
      });
    }

    return apiClient.request<ApiResponse<{
      notifications: Notification[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    }>>(`/notifications?page=${page}&limit=${limit}`);
  }

  // Get unread notifications
  async getUnreadNotifications(): Promise<ApiResponse<Notification[]>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      const unreadNotifications = mockNotificationData.filter(n => !n.read);
      return Promise.resolve({
        success: true,
        data: unreadNotifications
      });
    }

    return apiClient.request<ApiResponse<Notification[]>>('/notifications/unread');
  }

  // Get notification stats
  async getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      const stats: NotificationStats = {
        total: mockNotificationData.length,
        unread: mockNotificationData.filter(n => !n.read).length,
        by_type: {
          appointment: mockNotificationData.filter(n => n.type === 'appointment').length,
          property: mockNotificationData.filter(n => n.type === 'property').length,
          client: mockNotificationData.filter(n => n.type === 'client').length,
          payment: mockNotificationData.filter(n => n.type === 'payment').length,
          system: mockNotificationData.filter(n => n.type === 'system').length,
          marketing: mockNotificationData.filter(n => n.type === 'marketing').length,
        }
      };
      
      return Promise.resolve({
        success: true,
        data: stats
      });
    }

    return apiClient.request<ApiResponse<NotificationStats>>('/notifications/stats');
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      const notificationIndex = mockNotificationData.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1) {
        mockNotificationData[notificationIndex].read = true;
      }
      return Promise.resolve({ success: true });
    }

    return apiClient.request<ApiResponse<void>>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<void>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      mockNotificationData = mockNotificationData.map(n => ({ ...n, read: true }));
      return Promise.resolve({ success: true });
    }

    return apiClient.request<ApiResponse<void>>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      mockNotificationData = mockNotificationData.filter(n => n.id !== notificationId);
      return Promise.resolve({ success: true });
    }

    return apiClient.request<ApiResponse<void>>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Delete all read notifications
  async deleteAllRead(): Promise<ApiResponse<void>> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      mockNotificationData = mockNotificationData.filter(n => !n.read);
      return Promise.resolve({ success: true });
    }

    return apiClient.request<ApiResponse<void>>('/notifications/delete-read', {
      method: 'DELETE',
    });
  }
}

export const notificationApi = new NotificationApiService();