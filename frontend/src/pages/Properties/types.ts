export type PropertyFormData = {
  title: string;
  type: 'apartment' | 'house' | 'commercial' | 'plot' | 'row_house' | 'shop' | 'pg' | 'bungalow';
  listingType: 'sale' | 'rent';
  status: 'available' | 'sold' | 'rented' | 'under_negotiation';
  price: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  location: string;
  address: string;
  city: string;
  state: string;
  description: string;
  clientId: string;
};
