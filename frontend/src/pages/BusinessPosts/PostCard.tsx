import React, { useState } from 'react';
import { Heart, Share2, MapPin, Clock, Phone, MessageCircle, Star, X, Mail, User, Check } from 'lucide-react';
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

  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showContact, setShowContact] = useState(false);

  /* ── Like ── */
  const handleLike = () => setLiked((prev) => !prev);

  /* ── Share ── */
  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: `${post.title} — ${post.location}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ── WhatsApp ── */
  const handleWhatsApp = () => {
    const number = (post.contact_info.whatsapp || post.contact_info.phone).replace(/[^\d]/g, '');
    window.open(`https://wa.me/${number}`, '_blank');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
        {hasImage ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.images[0]}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 ${getSubcategoryBadgeColor(post.subcategory)} rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm`}>
                {getSubcategoryLabel(post.subcategory)}
              </span>
            </div>
            <div className="absolute top-3 right-3 flex space-x-2">
              <button
                onClick={handleLike}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                title={liked ? 'Unlike' : 'Like'}
              >
                <Heart className={`h-4 w-4 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                title="Share"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4 text-gray-700" />}
              </button>
            </div>
          </div>
        ) : (
          <div className={`relative h-48 bg-gradient-to-br ${getCategoryColor(post.category)} flex items-center justify-center`}>
            <CategoryIcon className="h-20 w-20 text-white opacity-40" />
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 ${getSubcategoryBadgeColor(post.subcategory)} rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm`}>
                {getSubcategoryLabel(post.subcategory)}
              </span>
            </div>
            <div className="absolute top-3 right-3 flex space-x-2">
              <button
                onClick={handleLike}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                title={liked ? 'Unlike' : 'Like'}
              >
                <Heart className={`h-4 w-4 transition-colors ${liked ? 'fill-red-400 text-red-400' : 'text-white'}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                title="Share"
              >
                {copied ? <Check className="h-4 w-4 text-green-300" /> : <Share2 className="h-4 w-4 text-white" />}
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

          {isVendor && post.rating && (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= post.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
              ))}
              <span className="text-xs text-gray-500 ml-1">{post.rating}/5</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500 mb-4">
            <MapPin className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{post.location}</span>
          </div>

          {!isVendor && post.price && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">₹{post.price.toLocaleString('en-IN')}</span>
                {post.subcategory === 'rent' && <span className="text-sm text-gray-500 ml-1">/month</span>}
                {post.subcategory === 'requirement' && post.category === 'staff' && <span className="text-sm text-gray-500 ml-1">/month</span>}
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
              {isVendor && (post.contact_info.whatsapp || post.contact_info.phone) && (
                <button
                  onClick={handleWhatsApp}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center space-x-1.5 shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              )}
              <button
                onClick={() => setShowContact(true)}
                className="px-4 py-2 btn-primary text-sm font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact modal */}
      {showContact && (
        <ContactModal post={post} onClose={() => setShowContact(false)} />
      )}

      {/* Copied toast */}
      {copied && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Check className="h-4 w-4 text-green-400" />
          Link copied to clipboard
        </div>
      )}
    </>
  );
};

/* ── Shared contact modal ── */
export const ContactModal: React.FC<{ post: BusinessPost; onClose: () => void }> = ({ post, onClose }) => {
  const handleCall = () => {
    window.location.href = `tel:${post.contact_info.phone.replace(/\s/g, '')}`;
  };
  const handleWhatsApp = () => {
    const number = (post.contact_info.whatsapp || post.contact_info.phone).replace(/[^\d]/g, '');
    window.open(`https://wa.me/${number}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{post.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact info */}
        <div className="space-y-3 mb-6">
          {post.contact_info.name && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-semibold text-gray-900">{post.contact_info.name}</p>
              </div>
            </div>
          )}

          {post.contact_info.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-semibold text-gray-900">{post.contact_info.phone}</p>
              </div>
            </div>
          )}

          {post.contact_info.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Mail className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{post.contact_info.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCall}
            className="flex items-center justify-center gap-2 py-3 btn-primary font-medium text-sm"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
