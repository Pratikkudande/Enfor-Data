import { Sofa, Users, Wrench, Tag, Briefcase, Home } from 'lucide-react';

export const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'furniture_office': return Briefcase;
    case 'furniture_house': return Home;
    case 'vendor': return Wrench;
    case 'staff': return Users;
    default: return Tag;
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'furniture_office': return 'from-blue-500 to-indigo-500';
    case 'furniture_house': return 'from-green-500 to-emerald-500';
    case 'vendor': return 'from-purple-500 to-violet-500';
    case 'staff': return 'from-orange-500 to-amber-500';
    default: return 'from-gray-500 to-slate-500';
  }
};

export const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'furniture_office': return 'Office Furniture';
    case 'furniture_house': return 'House Furniture';
    case 'vendor': return 'Vendor';
    case 'staff': return 'Staff';
    default: return category;
  }
};

export const getSubcategoryBadgeColor = (subcategory: string) => {
  switch (subcategory) {
    case 'sale': return 'bg-green-100 text-green-700';
    case 'rent': return 'bg-blue-100 text-blue-700';
    case 'requirement': return 'bg-orange-100 text-orange-700';
    // Vendor subcategories
    case 'rent_agreement': return 'bg-purple-100 text-purple-700';
    case 'house_service': return 'bg-teal-100 text-teal-700';
    case 'flat_cleaner': return 'bg-cyan-100 text-cyan-700';
    case 'pest_controller': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getSubcategoryLabel = (subcategory: string) => {
  switch (subcategory) {
    case 'sale': return 'For Sale';
    case 'rent': return 'For Rent';
    case 'requirement': return 'Requirement';
    case 'rent_agreement': return 'Rent Agreement';
    case 'house_service': return 'House Service';
    case 'flat_cleaner': return 'Flat Cleaner';
    case 'pest_controller': return 'Pest Controller';
    default: return subcategory.replace(/_/g, ' ');
  }
};
