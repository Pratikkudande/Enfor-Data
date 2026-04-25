import { Building2, Sofa, Users, Tag } from 'lucide-react';

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
    case 'property': return Building2;
    case 'furniture': return Sofa;
    case 'staff': return Users;
    default: return Tag;
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'property': return 'from-blue-500 to-cyan-500';
    case 'furniture': return 'from-green-500 to-emerald-500';
    case 'staff': return 'from-orange-500 to-amber-500';
    default: return 'from-gray-500 to-slate-500';
  }
};

export const getSubcategoryBadgeColor = (subcategory: string) => {
  switch (subcategory) {
    case 'sale': return 'bg-green-100 text-green-700';
    case 'rent': return 'bg-blue-100 text-blue-700';
    case 'requirement': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};
