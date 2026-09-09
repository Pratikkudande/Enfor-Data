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

export const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const createdAt = new Date(dateString);
  const diffInMilliseconds = now.getTime() - createdAt.getTime();
  
  // Convert to different time units
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Return appropriate format
  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  } else if (diffInWeeks > 0) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} min ago`;
  } else {
    return 'Just now';
  }
};
