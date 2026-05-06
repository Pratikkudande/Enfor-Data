import { api } from './apiClient';

// ============================================================
// Types
// ============================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  currency: string;
  max_properties: number | null;
  max_clients: number | null;
  max_appointments_per_month: number | null;
  max_sms_messages_per_month: number | null;
  max_whatsapp_messages_per_month: number | null;
  max_broker_connections: number | null;
  max_business_posts_per_month: number | null;
  max_team_members: number | null;
  has_analytics: boolean;
  has_advanced_analytics: boolean;
  has_api_access: boolean;
  has_custom_templates: boolean;
  has_priority_support: boolean;
  is_active: boolean;
  is_visible: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  is_trial: boolean;
  trial_starts_at?: string;
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  razorpay_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionDetails {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  usage: {
    properties: number;
    clients: number;
    appointments: number;
    sms_messages: number;
    whatsapp_messages: number;
    business_posts: number;
  };
  is_active: boolean;
  days_left: number;
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  is_active: boolean;
  is_trialing: boolean;
  is_paid: boolean;
  days_left: number;
  plan_slug?: string;
}

export interface FeatureLimitCheck {
  feature_name: string;
  has_access: boolean;
  limit: number;
  used: number;
  remaining: number;
}

export interface PlanComparison {
  plans: SubscriptionPlan[];
  features: FeatureComparison[];
}

export interface FeatureComparison {
  category: string;
  items: FeatureItem[];
}

export interface FeatureItem {
  name: string;
  key: string;
  values: { [planName: string]: any };
}

// ============================================================
// Subscription Plans
// ============================================================

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.get('/subscriptions/plans', { skipAuth: true });
  return response.data;
};

export const getSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan> => {
  const response = await api.get(`/subscriptions/plans/${planId}`, { skipAuth: true });
  return response.data;
};

export const getSubscriptionPlanBySlug = async (slug: string): Promise<SubscriptionPlan> => {
  const response = await api.get(`/subscriptions/plans/slug/${slug}`, { skipAuth: true });
  return response.data;
};

export const compareSubscriptionPlans = async (): Promise<PlanComparison> => {
  const response = await api.get('/subscriptions/plans/compare', { skipAuth: true });
  return response.data;
};

// ============================================================
// User Subscriptions
// ============================================================

export const getCurrentSubscription = async (): Promise<SubscriptionDetails | null> => {
  const response = await api.get('/subscriptions/current');
  return response.data.has_subscription === false ? null : response.data;
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await api.get('/subscriptions/status');
  return response.data;
};

export const activateTrial = async (): Promise<UserSubscription> => {
  const response = await api.post('/subscriptions/activate-trial');
  return response.data;
};

export const cancelSubscription = async (): Promise<void> => {
  await api.post('/subscriptions/cancel');
};

// ============================================================
// Feature Access
// ============================================================

export const checkFeatureAccess = async (feature: string): Promise<boolean> => {
  const response = await api.get(`/subscriptions/features/${feature}/access`);
  return response.data.has_access;
};

export const checkFeatureLimit = async (feature: string): Promise<FeatureLimitCheck> => {
  const response = await api.get(`/subscriptions/features/${feature}/limit`);
  return response.data;
};

export const getFeatureUsage = async (): Promise<{ usage: { [key: string]: number }; plan_name: string }> => {
  const response = await api.get('/subscriptions/usage');
  return response.data;
};

// ============================================================
// Payments
// ============================================================

export interface PaymentOrder {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
  plan_name: string;
}

export interface PaymentVerification {
  order_id: string;
  payment_id: string;
  signature: string;
}

export const createPaymentOrder = async (planId: string, billingCycle: 'monthly' | 'annual'): Promise<PaymentOrder> => {
  const response = await api.post('/payments/create-order', {
    plan_id: planId,
    billing_cycle: billingCycle
  });
  return response.data;
};

export const verifyPayment = async (verification: PaymentVerification): Promise<UserSubscription> => {
  const response = await api.post('/payments/verify', verification);
  return response.data;
};

export const getPaymentHistory = async (): Promise<any[]> => {
  const response = await api.get('/payments/history');
  return response.data;
};