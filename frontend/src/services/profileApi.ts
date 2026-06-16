import { apiClient } from './apiClient';
import { ApiResponse } from '../types';

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  company?: string;
  experience?: string;
  specialization?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  appointmentReminders: boolean;
  propertyUpdates: boolean;
  projectUpdates: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'network' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowDirectMessages: boolean;
  showOnlineStatus: boolean;
}

export interface PreferenceSettings {
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: PreferenceSettings;
}

class ProfileApiService {
  // Profile endpoints
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<any>> {
    return apiClient.request<ApiResponse<any>>('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<any>> {
    return apiClient.request<ApiResponse<any>>('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async uploadProfilePhoto(file: File): Promise<ApiResponse<{ profile_image: string }>> {
    return apiClient.upload('/upload/profile-photo', file, 'profile_photo');
  }

  // Settings endpoints
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return apiClient.request<ApiResponse<UserSettings>>('/settings');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return apiClient.request<ApiResponse<UserSettings>>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateNotificationSettings(notifications: NotificationSettings): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.request<ApiResponse<NotificationSettings>>('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(notifications),
    });
  }

  async updatePrivacySettings(privacy: PrivacySettings): Promise<ApiResponse<PrivacySettings>> {
    return apiClient.request<ApiResponse<PrivacySettings>>('/settings/privacy', {
      method: 'PUT',
      body: JSON.stringify(privacy),
    });
  }

  async updatePreferenceSettings(preferences: PreferenceSettings): Promise<ApiResponse<PreferenceSettings>> {
    return apiClient.request<ApiResponse<PreferenceSettings>>('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }
}

export const profileApi = new ProfileApiService();