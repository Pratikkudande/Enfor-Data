import React from 'react';
import { Heart, Share2, MapPin, Clock, Phone, MessageCircle, Star } from 'lucide-react';
import { BusinessPost } from '../../types';
import {
  getCategoryIcon,
  getCategoryColor,
  getCategoryLabel,
  getSubcategoryBadgeColor,
  getSubcategoryLabel,
  getTimeAgo,
} from './utils';

interface PostCardProps {
  post: BusinessPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const CategoryIcon = getCategoryIcon(post.category);
  const hasImage = post.images.length > 0;
  const isVendor = post.category === 'vendor';

  const handleWhatsApp = () => {
    const number = (post.contact_info.whatsapp || post.contact_info.phone).replace(/[^\d]/g, '');
    window.open(`https://wa.me/${number}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
      {hasImage ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 ${getSubcategoryBadgeColor(post.subcategory)} rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm`}
            >
              {getSubcategoryLabel(post.subcategory)}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex space-x-2">
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg">
              <Heart className="h-4 w-4 text-gray-700" />
            </button>
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg">
              <Share2 className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`relative h-48 bg-gradient-to-br ${getCategoryColor(post.category)} flex items-center justify-center`}
        >
          <CategoryIcon className="h-20 w-20 text-white opacity-40" />
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 ${getSubcategoryBadgeColor(post.subcategory)} rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm`}
            >
              {getSubcategoryLabel(post.subcategory)}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex space-x-2">
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
              <Heart className="h-4 w-4 text-white" />
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Category + status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 bg-gradient-to-br ${getCategoryColor(post.category)} rounded-lg`}>
              <CategoryIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">{getCategoryLabel(post.category)}</span>
          </div>
          {post.status === 'active' && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
              Active
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>

        {/* Vendor: rating */}
        {isVendor && post.rating && (
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${s <= post.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">{post.rating}/5</span>
          </div>
        )}

        {/* Location / service area */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <MapPin className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">{post.location}</span>
        </div>

        {/* Price — not for vendor */}
        {!isVendor && post.price && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                ₹{post.price.toLocaleString('en-IN')}
              </span>
              {post.subcategory === 'rent' && (
                <span className="text-sm text-gray-500 ml-1">/month</span>
              )}
              {post.subcategory === 'requirement' && post.category === 'staff' && (
                <span className="text-sm text-gray-500 ml-1">/month</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {getTimeAgo(post.created_at)}
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp button for vendors */}
            {isVendor && (post.contact_info.whatsapp || post.contact_info.phone) && (
              <button
                onClick={handleWhatsApp}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center space-x-1.5 shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>
            )}
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 text-sm font-medium flex items-center space-x-2 shadow-sm hover:shadow-md">
              <Phone className="h-4 w-4" />
              <span>Contact</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
