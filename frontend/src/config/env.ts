export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
