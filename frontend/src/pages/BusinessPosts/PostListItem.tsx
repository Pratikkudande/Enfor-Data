import React, { useState } from 'react';
import { Heart, Share2, MapPin, Clock, Phone, MoreVertical, MessageCircle, Star, Check } from 'lucide-react';
import { BusinessPost } from '../../types';
import {
  getCategoryIcon,
  getCategoryColor,
  getCategoryLabel,
  getSubcategoryBadgeColor,
  getSubcategoryLabel,
  getTimeAgo,
} from './utils';
import { ContactModal } from './PostCard';

interface PostListItemProps {
  post: BusinessPost;
}

const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
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
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
        <div className="flex flex-col md:flex-row">
          {hasImage ? (
            <div className="relative w-full md:w-72 h-52 flex-shrink-0 overflow-hidden">
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
            </div>
          ) : (
            <div className={`relative w-full md:w-72 h-52 flex-shrink-0 bg-gradient-to-br ${getCategoryColor(post.category)} flex items-center justify-center`}>
              <CategoryIcon className="h-24 w-24 text-white opacity-40" />
              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 ${getSubcategoryBadgeColor(post.subcategory)} rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm`}>
                  {getSubcategoryLabel(post.subcategory)}
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 p-6">
            {/* Title row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-gradient-to-br ${getCategoryColor(post.category)} rounded-lg`}>
                  <CategoryIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                    {post.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span>{getCategoryLabel(post.category)}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {getTimeAgo(post.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {post.status === 'active' && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                    Active
                  </span>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>

            {/* Vendor rating */}
            {isVendor && post.rating && (
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= post.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-500 ml-1">{post.rating}/5</span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600 mb-4">
              <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{post.location}</span>
            </div>

            {/* Price + action buttons */}
            <div className="flex items-center justify-between">
              <div>
                {!isVendor && post.price && (
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{post.price.toLocaleString('en-IN')}
                    </span>
                    {post.subcategory === 'rent' && <span className="text-sm text-gray-500 ml-1">/month</span>}
                    {post.subcategory === 'requirement' && post.category === 'staff' && <span className="text-sm text-gray-500 ml-1">/month</span>}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Like */}
                <button
                  onClick={handleLike}
                  title={liked ? 'Unlike' : 'Like'}
                  className={`p-2 rounded-lg transition-colors ${liked ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Heart className={`h-5 w-5 transition-colors ${liked ? 'fill-red-500' : ''}`} />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  title="Share"
                  className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
                </button>

                {/* WhatsApp — vendors only */}
                {isVendor && (post.contact_info.whatsapp || post.contact_info.phone) && (
                  <button
                    onClick={handleWhatsApp}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2 shadow-sm"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp</span>
                  </button>
                )}

                {/* Contact */}
                <button
                  onClick={() => setShowContact(true)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <Phone className="h-5 w-5" />
                  <span>Contact</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact modal */}
      {showContact && <ContactModal post={post} onClose={() => setShowContact(false)} />}

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

export default PostListItem;
