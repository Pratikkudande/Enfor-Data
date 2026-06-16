import { apiClient } from './apiClient';
import { ApiResponse } from '../types';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'property' | 'project' | 'client' | 'payment' | 'system' | 'marketing';
  priority?: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: {
    property_id?: string;
    project_id?: string;
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
    project: number;
    client: number;
    payment: number;
    system: number;
    marketing: number;
  };
}

type Paginated = {
  notifications: Notification[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

// The backend responds with { message, data }. apiClient.request throws on
// non-2xx, so any returned value means success — we normalise to { success, data }.
const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data });

class NotificationApiService {
  async getNotifications(page = 1, limit = 20): Promise<ApiResponse<Paginated>> {
    const res = await apiClient.request<{ data: Paginated }>(`/notifications?page=${page}&limit=${limit}`);
    return ok(res.data);
  }

  // No dedicated unread endpoint — fetch the latest page and filter unread.
  async getUnreadNotifications(): Promise<ApiResponse<Notification[]>> {
    const res = await apiClient.request<{ data: Paginated }>(`/notifications?page=1&limit=50`);
    const unread = (res.data?.notifications || []).filter((n) => !n.read);
    return ok(unread);
  }

  async getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
    const res = await apiClient.request<{ data: { total: number; unread: number; by_type: Record<string, number> } }>(
      '/notifications/stats',
    );
    const bt = res.data?.by_type || {};
    const stats: NotificationStats = {
      total: res.data?.total || 0,
      unread: res.data?.unread || 0,
      by_type: {
        appointment: bt.appointment || 0,
        property: bt.property || 0,
        project: bt.project || 0,
        client: bt.client || 0,
        payment: bt.payment || 0,
        system: bt.system || 0,
        marketing: bt.marketing || 0,
      },
    };
    return ok(stats);
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    await apiClient.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
    return { success: true };
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    await apiClient.request('/notifications/read-all', { method: 'PUT' });
    return { success: true };
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    await apiClient.request(`/notifications/${notificationId}`, { method: 'DELETE' });
    return { success: true };
  }

  async deleteAllRead(): Promise<ApiResponse<void>> {
    const res = await apiClient.request<{ data: Paginated }>(`/notifications?page=1&limit=100`);
    const readOnes = (res.data?.notifications || []).filter((n) => n.read);
    await Promise.all(readOnes.map((n) => apiClient.request(`/notifications/${n.id}`, { method: 'DELETE' })));
    return { success: true };
  }
}

export const notificationApi = new NotificationApiService();
export default notificationApi;
