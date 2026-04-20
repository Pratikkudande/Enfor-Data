import { PropertyFormData } from './types';

export const initialFormData: PropertyFormData = {
  title: '',
  type: 'apartment',
  listingType: 'sale',
  status: 'available',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  location: '',
  address: '',
  city: '',
  state: '',
  description: '',
  clientId: '',
};

export const commonAmenities = [
  'Swimming Pool', 'Gym', 'Security', 'Parking', '24/7 Water',
  'Power Backup', 'Elevator', 'Garden', 'Playground', 'Club House',
  'CCTV', 'Intercom', 'Fire Safety', 'Waste Management', 'Wi-Fi',
  'Air Conditioning', 'Balcony', 'Furnished', 'Semi-Furnished'
];
