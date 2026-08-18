import { Property } from '../../types';
import { PropertyFormData } from './types';

export const transformProperty = (property: any): Property => ({
  ...property,
  images: property.images || [],
  photos: property.photos || [],
  owner_id: property.owner_id || property.broker_id,
});

export const propertyToFormData = (property: Property): PropertyFormData => ({
  title: property.title,
  type: property.type,
  listingType: property.listing_type,
  status: property.status,
  price: property.price.toString(),
  area: property.area.toString(),
  bedrooms: property.bedrooms?.toString() || '',
  bathrooms: property.bathrooms?.toString() || '',
  buildupArea: property.buildup_area?.toString() || '',
  carpetArea: property.carpet_area?.toString() || '',
  measurementUnit: property.measurement_unit || 'sq_ft',
  deposit: property.deposit?.toString() || '',
  location: property.location,
  address: property.address,
  city: property.city,
  state: property.state,
  description: property.description,
  clientId: property.client_id || '',
});

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'sold':
      return 'bg-red-100 text-red-800';
    case 'rented':
      return 'bg-indigo-100 text-indigo-800';
    case 'hold':
      return 'bg-amber-100 text-amber-800';
    case 'closed':
      return 'bg-gray-200 text-gray-800';
    case 'under_discussion':
    case 'under_negotiation':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatPrice = (price: number, listingType: string) => {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

  return listingType === 'rent' ? `${formattedPrice}/month` : formattedPrice;
};
