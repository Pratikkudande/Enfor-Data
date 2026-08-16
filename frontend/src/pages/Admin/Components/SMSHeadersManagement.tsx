import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Hash, Search } from 'lucide-react';
import { adminGetAllSMSHeaders, adminCreateSMSHeader, adminUpdateSMSHeader, adminDeleteSMSHeader } from '../../../services/adminDLTApi';

interface SMSHeader {
  id: string;
  user_id: string;
  created_by_name?: string;
  header: string;
  provider?: string;
  type: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
}

const SMSHeadersManagement: React.FC = () => {
  const [headers, setHeaders] = useState<SMSHeader[]>([]);
  const [filteredHeaders, setFilteredHeaders] = useState<SMSHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHeader, setEditingHeader] = useState<SMSHeader | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    header: '',
    provider: '',
    type: 'Promotional',
    status: 'Active',
  });

  useEffect(() => {
    loadHeaders();
  }, []);

  useEffect(() => {
    filterHeaders();
  }, [headers, searchTerm, statusFilter, providerFilter]);

  const loadHeaders = async () => {
    try {
      setLoading(true);
      const data = await adminGetAllSMSHeaders();
      setHeaders(data.headers || []);
    } catch (error) {
      console.error('Failed to load SMS headers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHeaders = () => {
    let filtered = [...headers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (h) =>
          h.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (h.created_by_name && h.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((h) => h.status === statusFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((h) => h.provider === providerFilter);
    }

    setFilteredHeaders(filtered);
  };

  // Get unique providers for filter dropdown
  const uniqueProviders = Array.from(
    new Set(headers.map((h) => h.provider).filter((p) => p))
  ).sort();

  const handleEdit = (header: SMSHeader) => {
    setEditingHeader(header);
    setFormData({
      header: header.header,
      provider: header.provider || '',
      type: header.type,
      status: header.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingHeader) {
        // Update existing header
        await adminUpdateSMSHeader(editingHeader.id, formData);
        alert('SMS Header updated successfully');
      } else {
        // Create new header
        await adminCreateSMSHeader(formData);
        alert('SMS Header created successfully');
      }
      
      setShowModal(false);
      setEditingHeader(null);
      loadHeaders();
    } catch (error: any) {
      alert('Failed to save header: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (headerId: string) => {
    if (!confirm('Are you sure you want to delete this SMS header?')) return;

    try {
      await adminDeleteSMSHeader(headerId);
      alert('SMS Header deleted successfully');
      loadHeaders();
    } catch (error: any) {
      alert('Failed to delete header: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registered':
        return 'bg-green-100 text-gray-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Created':
        return 'bg-gray-100 text-gray-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SMS Headers Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage SMS sender IDs and headers across all users
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by header or creator name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Created">Created</option>
              <option value="Registered">Registered</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Providers</option>
              {uniqueProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats and Add Button */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredHeaders.length}</span> of{' '}
            <span className="font-semibold">{headers.length}</span> headers
          </div>
          <button
            onClick={() => {
              setEditingHeader(null);
              setFormData({
                header: '',
                provider: '',
                type: 'Promotional',
                status: 'Active',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Header
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Header
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHeaders.map((header) => (
                <tr key={header.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {header.created_by_name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">{header.header}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {header.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{header.provider || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(header.status)}`}>
                      {header.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(header)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(header.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredHeaders.length === 0 && (
          <div className="text-center py-12">
            <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No SMS headers found</p>
            <p className="text-sm text-gray-500 mt-2">
              {headers.length === 0
                ? 'Headers will appear here once brokers add them'
                : 'No headers match your search criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingHeader ? 'Edit SMS Header' : 'Add SMS Header'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingHeader(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Header / Sender ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.header}
                  onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Provider (Optional)</option>
                  <option value="MSG91">MSG91</option>
                  <option value="Fast2SMS">Fast2SMS</option>
                  <option value="JIO">JIO</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Promotional">Promotional</option>
                  <option value="Service">Service</option>
                  <option value="Implicit">Implicit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Created">Created</option>
                  <option value="Registered">Registered</option>
                  <option value="Approved">Approved</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingHeader(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingHeader ? 'Update' : 'Add'} Header
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSHeadersManagement;
