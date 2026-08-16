import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Hash } from 'lucide-react';
import {
  getSMSHeaders,
  createSMSHeader,
  updateSMSHeader,
  deleteSMSHeader,
  SMSHeader,
  CreateSMSHeaderRequest,
} from '../../../services/smsMarketingApi';
import { useAuth } from '../../../context/AuthContext';

const HeadersTab: React.FC = () => {
  const { user } = useAuth();
  const isBroker = user?.role === 'broker' || user?.role === 'channel_partner';

  const [headers, setHeaders] = useState<SMSHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHeader, setEditingHeader] = useState<SMSHeader | null>(null);
  const [formData, setFormData] = useState<CreateSMSHeaderRequest>({
    header: '',
    provider: '',
    type: 'Promotional',
    status: isBroker ? 'Created' : 'Active',
  });

  useEffect(() => {
    loadHeaders();
  }, []);

  const loadHeaders = async () => {
    try {
      setLoading(true);
      const data = await getSMSHeaders();
      console.log('SMS Headers API response:', data);
      console.log('Headers array:', data?.headers);
      console.log('Headers count:', data?.headers?.length);
      setHeaders(data?.headers || []);
    } catch (error) {
      console.error('Failed to load SMS headers:', error);
      setHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingHeader) {
        await updateSMSHeader(editingHeader.id, formData);
        alert('SMS Header updated successfully!');
      } else {
        await createSMSHeader(formData);
        alert('SMS Header added successfully!');
      }
      
      setShowModal(false);
      setEditingHeader(null);
      resetForm();
      loadHeaders();
    } catch (error: any) {
      alert('Failed to save header: ' + (error.response?.data?.message || error.message));
    }
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMS header?')) return;
    
    try {
      await deleteSMSHeader(id);
      loadHeaders();
    } catch (error: any) {
      alert('Failed to delete header: ' + (error.response?.data?.message || error.message));
    }
  };

  const canEditOrDelete = (header: SMSHeader) => {
    if (user?.role === 'admin') {
      return true;
    }
    
    if (isBroker) {
      const isOwner = header.created_by === user?.id;
      const canEdit = header.status === 'Created' || header.status === 'Rejected';
      return isOwner && canEdit;
    }
    
    return false;
  };

  const resetForm = () => {
    setFormData({
      header: '',
      provider: '',
      type: 'Promotional',
      status: isBroker ? 'Created' : 'Active',
    });
  };

  const openCreateModal = () => {
    setEditingHeader(null);
    resetForm();
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created':
        return 'bg-gray-100 text-gray-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
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
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">SMS Headers / Sender IDs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your approved SMS sender IDs for sending messages
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Header
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {headers.map((header) => (
            <div key={header.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-lg">{header.header}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(header.status)}`}>
                      {header.status}
                    </span>
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {header.type}
                    </span>
                  </div>
                </div>
                {canEditOrDelete(header) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(header)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit header"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(header.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete header"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {header.provider && (
                  <div>
                    <span className="font-medium">Provider:</span> {header.provider}
                  </div>
                )}
                {header.created_by_name && (
                  <div>
                    <span className="font-medium">Created by:</span> {header.created_by_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {headers.length === 0 && (
          <div className="text-center py-12">
            <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No SMS headers yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Add your first SMS header to start sending messages
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
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
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
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
                  placeholder="e.g., ENFOR, PROPRT"
                  maxLength={10}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 10 characters, uppercase letters only
                </p>
              </div>

              {!isBroker && (
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
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Promotional">Promotional</option>
                  <option value="Service">Service</option>
                  <option value="Implicit">Implicit</option>
                </select>
              </div>

              {!isBroker && (
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
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingHeader(null);
                    resetForm();
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

export default HeadersTab;
