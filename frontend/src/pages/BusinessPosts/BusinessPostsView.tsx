import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Tag,
  X,
  Users,
  TrendingUp,
  ChevronDown,
  Briefcase,
  Home,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { mockPosts } from './mockData';
import { getCategoryIcon, getCategoryLabel } from './utils';
import PostCard from './PostCard';
import PostListItem from './PostListItem';
import CreatePostModal from './CreatePostModal';
import { BusinessPost } from '../../types';

type TabType = 'all' | 'furniture_office' | 'furniture_house' | 'vendor' | 'staff';

const TABS: { value: TabType; label: string; icon: React.ElementType; colorClass: string }[] = [
  { value: 'all', label: 'All Posts', icon: TrendingUp, colorClass: 'text-blue-600' },
  { value: 'furniture_office', label: 'Office Furniture', icon: Briefcase, colorClass: 'text-blue-600' },
  { value: 'furniture_house', label: 'House Furniture', icon: Home, colorClass: 'text-green-600' },
  { value: 'vendor', label: 'Vendors', icon: Wrench, colorClass: 'text-purple-600' },
  { value: 'staff', label: 'Staff', icon: Users, colorClass: 'text-orange-600' },
];

const BusinessPostsView: React.FC = () => {
  const [posts, setPosts] = useState<BusinessPost[]>(mockPosts);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePostCreated = (post: BusinessPost) => {
    setPosts((prev) => [post, ...prev]);
    setSuccessMessage('Post published successfully!');
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === 'all' || post.category === activeTab;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcategory = selectedSubcategory === 'all' || post.subcategory === selectedSubcategory;
    return matchesTab && matchesSearch && matchesSubcategory;
  });

  const stats = {
    total: posts.length,
    furniture_office: posts.filter((p) => p.category === 'furniture_office').length,
    furniture_house: posts.filter((p) => p.category === 'furniture_house').length,
    vendor: posts.filter((p) => p.category === 'vendor').length,
    staff: posts.filter((p) => p.category === 'staff').length,
  };

  const getTabCount = (tab: TabType) => {
    if (tab === 'all') return stats.total;
    return stats[tab] ?? 0;
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Posts</h1>
            <p className="text-gray-600">Share and discover business opportunities in real estate</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 px-6 py-3 btn-primary flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Create Post</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <div className="text-blue-100 text-sm font-medium">Total Posts</div>
          </div>

          {[
            { key: 'furniture_office', label: 'Office Furniture', Icon: Briefcase, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
            { key: 'furniture_house', label: 'House Furniture', Icon: Home, bg: 'bg-green-50', iconColor: 'text-green-600' },
            { key: 'vendor', label: 'Vendors', Icon: Wrench, bg: 'bg-purple-50', iconColor: 'text-purple-600' },
            { key: 'staff', label: 'Staff', Icon: Users, bg: 'bg-orange-50', iconColor: 'text-orange-600' },
          ].map(({ key, label, Icon, bg, iconColor }) => (
            <div
              key={key}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${bg} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats[key as keyof typeof stats]}</span>
              </div>
              <div className="text-gray-600 text-sm font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                activeTab === value
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {value !== 'all' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === value ? 'bg-white/20' : 'bg-white'
                  }`}
                >
                  {getTabCount(value)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + view toggle */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                  <option value="requirement">Requirement</option>
                  <optgroup label="Vendor Categories">
                    <option value="rent_agreement">Rent Agreement</option>
                    <option value="house_service">House Service</option>
                    <option value="flat_cleaner">Flat Cleaner</option>
                    <option value="pest_controller">Pest Controller</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {(selectedSubcategory !== 'all' || searchQuery) && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {selectedSubcategory !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Type: {selectedSubcategory.replace(/_/g, ' ')}
                      <button
                        onClick={() => setSelectedSubcategory('all')}
                        className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedSubcategory('all'); setSearchQuery(''); }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Posts grid/list */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters to find posts</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Create Your First Post</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      )}

      <CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onPostCreated={handlePostCreated} />

      {/* Success toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 max-w-sm">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default BusinessPostsView;
