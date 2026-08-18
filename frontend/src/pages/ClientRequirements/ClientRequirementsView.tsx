import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Trash2, MapPin, Home, IndianRupee } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { clientRequirementApi, ClientRequirement } from '../../services/clientRequirementApi';
import { apiClient } from '../../services/api';
import { API_CONFIG } from '../../config/api';
import AddRequirementModal from './Components/AddRequirementModal';
import RequirementDetailModal from './Components/RequirementDetailModal';

const ClientRequirementsView: React.FC = () => {
  const location = useLocation();
  const [requirements, setRequirements] = useState<ClientRequirement[]>([]);
  const [filteredRequirements, setFilteredRequirements] = useState<ClientRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'rent'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'fulfilled' | 'cancelled'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<ClientRequirement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [prefilledClientId, setPrefilledClientId] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRequirements();
    
    // Check if we're coming from client card with pre-filled client info
    const state = location.state as { openAdd?: boolean; clientId?: string; clientName?: string } | null;
    if (state?.openAdd && state?.clientId) {
      setPrefilledClientId(state.clientId);
      setShowAddModal(true);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    filterRequirements();
  }, [requirements, searchTerm, filterType, filterStatus]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const data = await clientRequirementApi.getRequirements();
      setRequirements(data.requirements || []);
    } catch (error) {
      console.error('Failed to load requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequirements = () => {
    let filtered = requirements;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.client_phone?.includes(searchTerm) ||
          req.preferred_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.enquiry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((req) => req.requirement_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    setFilteredRequirements(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;

    try {
      await clientRequirementApi.deleteRequirement(id);
      alert('Requirement deleted successfully');
      loadRequirements();
    } catch (error) {
      alert('Failed to delete requirement');
    }
  };

  const handleView = (requirement: ClientRequirement) => {
    setSelectedRequirement(requirement);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'buy' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `₹${min.toLocaleString()}+`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return 'Not specified';
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      await apiClient.uploadClientRequirementsExcel(file);
      setUploadSuccess('Requirements uploaded successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
      loadRequirements();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Requirements</h1>
          <p className="text-gray-600 mt-1">Manage your client property requirements</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary px-4 py-2 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Requirement
          </button>
          <button
            onClick={() => window.open(`${API_CONFIG.BASE_URL}/download/client-requirements-sample`)}
            className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Download Sample Excel
          </button>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            id="requirementsExcelInput"
            className="hidden"
            onChange={handleExcelUpload}
          />
          <button
            onClick={() => document.getElementById('requirementsExcelInput')?.click()}
            disabled={uploading}
            className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Excel'}
          </button>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {uploadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}
        {uploadSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800">{uploadSuccess}</p>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by client name, phone, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requirements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading requirements...</p>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No requirements found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first client requirement'}
          </p>
          {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Requirement
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequirements.map((requirement) => (
            <div
              key={requirement.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{requirement.client_name}</h3>
                  <p className="text-sm text-gray-600">{requirement.client_phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(requirement)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(requirement.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(requirement.requirement_type)}`}>
                  {requirement.requirement_type === 'buy' ? 'Buy' : 'Rent'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(requirement.status)}`}>
                  {requirement.status}
                </span>
              </div>

              {/* Property Type */}
              {requirement.enquiry && (
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <Home className="w-4 h-4" />
                  <span>{requirement.enquiry}</span>
                </div>
              )}

              {/* Location */}
              {requirement.preferred_location && (
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{requirement.preferred_location}</span>
                </div>
              )}

              {/* Budget */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <IndianRupee className="w-4 h-4" />
                <span>{formatBudget(requirement.min_budget, requirement.max_budget)}</span>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                Added {new Date(requirement.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddRequirementModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setPrefilledClientId(undefined);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setPrefilledClientId(undefined);
            loadRequirements();
          }}
          initialClientId={prefilledClientId}
        />
      )}

      {showDetailModal && selectedRequirement && (
        <RequirementDetailModal
          requirement={selectedRequirement}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequirement(null);
          }}
          onUpdate={() => {
            loadRequirements();
          }}
        />
      )}
    </div>
  );
};

export default ClientRequirementsView;
