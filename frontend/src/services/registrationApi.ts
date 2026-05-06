import { api } from './apiClient';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  password: string;
  role: string;
  businessName: string;
  city: string;
  state: string;
  experience?: string;
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export interface RegistrationResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    businessName: string;
  };
  token: string;
  refreshToken: string;
}

export const registerUser = async (data: RegistrationData): Promise<RegistrationResponse> => {
  const response = await api.post('/auth/signup', {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    whatsapp_number: data.whatsappNumber,
    password: data.password,
    role: data.role,
    firm_name: data.businessName, // Backend expects firm_name
    city: data.city,
    state: data.state,
    // Required fields that we need to provide defaults for
    date_of_birth: "1990-01-01", // Default date, can be updated later
    address: `${data.city}, ${data.state}`, // Combine city and state as address
    location: data.city,
    postal_code: "000000" // Default postal code, can be updated later
  }, { skipAuth: true });

  // Store tokens
  if (response.data.token) {
    localStorage.setItem('enfor_token', response.data.token);
  }
  if (response.data.refresh_token) {
    localStorage.setItem('enfor_refresh_token', response.data.refresh_token);
  }

  return response.data;
};