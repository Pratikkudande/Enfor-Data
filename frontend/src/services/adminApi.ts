import { API_CONFIG } from '../config/api';

const BASE = API_CONFIG.BASE_URL;

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('enfor_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(),
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
}

// --- Dashboard ---
export const getDashboard = () =>
  adminFetch<any>('/admin/dashboard');

// --- Contact Messages (from the public landing-page form) ---
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getContactMessages = () =>
  adminFetch<{ data: ContactMessage[] }>('/admin/contact-messages');

// --- Users ---
export const getUsers = (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return adminFetch<any>(`/admin/users?${qs}`);
};

export const getUserDetails = (id: string) =>
  adminFetch<any>(`/admin/users/${id}`);

export const updateUserStatus = (id: string, status: 'activate' | 'deactivate' | 'block') =>
  adminFetch<any>(`/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const deleteUser = (id: string) =>
  adminFetch<any>(`/admin/users/${id}`, { method: 'DELETE' });

export const loginAsBroker = (id: string) =>
  adminFetch<any>(`/admin/users/${id}/login-as`, { method: 'POST' });

// --- Revenue ---
export const getRevenue = (params?: { page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return adminFetch<any>(`/admin/revenue?${qs}`);
};

// --- SMS ---
export const getSMSStats = () =>
  adminFetch<any>('/admin/sms');

// --- Audit Logs ---
export const getAuditLogs = (params?: { page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return adminFetch<any>(`/admin/audit-logs?${qs}`);
};

// --- Announcements ---
export const getAnnouncements = (params?: { page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return adminFetch<any>(`/admin/announcements?${qs}`);
};

export const createAnnouncement = (data: {
  title: string;
  message: string;
  type: string;
  target: string;
  target_value?: string;
}) => adminFetch<any>('/admin/announcements', { method: 'POST', body: JSON.stringify(data) });

export const sendAnnouncement = (id: string) =>
  adminFetch<any>(`/admin/announcements/${id}/send`, { method: 'POST' });

// --- Feedback ---
export const getFeedback = (params?: { status?: string; page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return adminFetch<any>(`/admin/feedback?${qs}`);
};

export const updateFeedback = (id: string, status: string, adminNotes: string) =>
  adminFetch<any>(`/admin/feedback/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  });

export const submitFeedback = (data: { type: string; title: string; description: string }) =>
  adminFetch<any>('/feedback', { method: 'POST', body: JSON.stringify(data) });

// --- Renewals ---
export const getRenewals = () =>
  adminFetch<any>('/admin/renewals');

// --- Activity ---
export const getActivity = (params?: { page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return adminFetch<any>(`/admin/activity?${qs}`);
};

// --- Storage ---
export const getStorage = () =>
  adminFetch<any>('/admin/storage');

// --- Config ---
export const getConfig = () =>
  adminFetch<any>('/admin/config');

export const updateConfig = (key: string, value: string) =>
  adminFetch<any>('/admin/config', { method: 'PUT', body: JSON.stringify({ key, value }) });

// --- Downloads ---
export const downloadData = (type: string, brokerID?: string, format = 'csv') => {
  const qs = new URLSearchParams({ format });
  if (brokerID) qs.set('broker_id', brokerID);
  const token = localStorage.getItem('enfor_token');
  const url = `${BASE}/admin/download/${type}?${qs}`;
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', `${type}_export.csv`);
  // Pass token via fetch for blob download
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${type}_export.csv`;
      link.click();
    });
};
