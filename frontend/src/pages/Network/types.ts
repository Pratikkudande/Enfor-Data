export interface Broker {
  id: string;
  name: string;
  company: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  profileImage?: string;
  specialization: string[];
  experience: number;
  propertiesListed: number;
  rating: number;
  isVerified: boolean;
  dealsClosed: number;
}
