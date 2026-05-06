export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROPERTIES: '/properties',
  WHATSAPP: '/whatsapp',
  SMS_MARKETING: '/sms-marketing',
  CLIENTS: '/clients',
  APPOINTMENTS: '/appointments',
  NETWORK: '/network',
  BUSINESS_POSTS: '/business-posts',
  MARKETING: '/marketing',
  
  // Profile & Settings Routes
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  
  // Subscription Routes
  PRICING: '/pricing',
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_ACTIVATE_TRIAL: '/subscription/activate-trial',
  SUBSCRIPTION_CHECKOUT: '/subscription/checkout/:planId',
  SUBSCRIPTION_SUCCESS: '/subscription/success',
} as const;
