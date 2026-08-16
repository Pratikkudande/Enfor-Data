import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Trash2, Shield, Edit } from 'lucide-react';
import { adminGetAllDLTTemplates, adminDeleteDLTTemplate, adminUpdateDLTTemplate } from '../../services/adminDLTApi';
import { SMSDLTTemplate, getAvailableHeadersByType, SMSHeader } from '../../services/smsMarketingApi';
import AddDLTTemplateModal from '../SMSMarketing/Components/AddDLTTemplateModal';
import SMSHeadersManagement from './Components/SMSHeadersManagement';

type TabType = 'templates' | 'headers';

const TeleMarketerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<SMSDLTTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SMSDLTTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SMSDLTTemplate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSDLTTemplate | null>(null);
  const [availableHeaders, setAvailableHeaders] = useState<SMSHeader[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, statusFilter, providerFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await adminGetAllDLTTemplates();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.template_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((t) => t.provider === providerFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this DLT template?')) return;

    try {
      await adminDeleteDLTTemplate(templateId);
      alert('Template deleted successfully');
      loadTemplates();
    } catch (error: any) {
      alert('Failed to delete template: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (template: SMSDLTTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
    // Load headers for the template type
    loadAvailableHeaders(template.template_type);
  };

  const loadAvailableHeaders = async (type: 'Promotional' | 'Service') => {
    try {
      setLoadingHeaders(true);
      const response = await getAvailableHeadersByType(type);
      setAvailableHeaders(response.headers || []);
    } catch (error) {
      console.error('Failed to load headers:', error);
      setAvailableHeaders([]);
    } finally {
      setLoadingHeaders(false);
    }
  };

  const handleTemplateTypeChange = (type: 'Promotional' | 'Service') => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, template_type: type, header: '' });
      loadAvailableHeaders(type);
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      await adminUpdateDLTTemplate(editingTemplate.id, {
        header: editingTemplate.header,
        template_id: editingTemplate.template_id,
        template_name: editingTemplate.template_name,
        template_type: editingTemplate.template_type,
        category: editingTemplate.category,
        provider: editingTemplate.provider,
        template_content: editingTemplate.template_content,
        sample_content: editingTemplate.sample_content || '',
        status: editingTemplate.status,
        variable_count: editingTemplate.variable_count,
      });
      alert('Template updated successfully');
      setShowEditModal(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      alert('Failed to update template: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRowClick = (template: SMSDLTTemplate) => {
    setSelectedTemplate(template);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Registered':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueProviders = Array.from(new Set(templates.map((t) => t.provider)));
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" />
          TeleMarketer Management
        </h1>
        <p className="text-gray-600 mt-1">Manage DLT SMS templates and headers across all users</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          DLT Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'headers'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          SMS Headers
        </button>
      </div>

      {/* Content */}
      {activeTab === 'templates' ? (
        <>
          {/* Filters and Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, ID, template ID, or header..."
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
              <option value="Active">Active</option>
              <option value="Created">Created</option>
              <option value="Approved">Approved</option>
              <option value="Registered">Registered</option>
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
            Showing <span className="font-semibold">{filteredTemplates.length}</span> of{' '}
            <span className="font-semibold">{templates.length}</span> templates
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr
                  key={template.id}
                  onClick={() => handleRowClick(template)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.created_by_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {template.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.template_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {template.template_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {template.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        template.status
                      )}`}
                    >
                      {template.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(template);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                        className="text-red-600 hover:text-red-800"
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

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No DLT templates found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || statusFilter !== 'all' || providerFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first template to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {showDetailModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Template Details</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.template_name}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <p className="text-gray-900">{selectedTemplate.template_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template ID
                  </label>
                  <p className="text-gray-900">{selectedTemplate.template_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header</label>
                  <p className="text-gray-900">{selectedTemplate.header}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <p className="text-gray-900">{selectedTemplate.provider}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{selectedTemplate.template_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                      selectedTemplate.status
                    )}`}
                  >
                    {selectedTemplate.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variable Count
                  </label>
                  <p className="text-gray-900">{selectedTemplate.variable_count}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By
                  </label>
                  <p className="text-gray-900">{selectedTemplate.created_by_name}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Content
                </label>
                <div className="bg-gray-50 rounded p-4 border border-gray-200">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                    {selectedTemplate.template_content}
                  </pre>
                </div>
              </div>

              {selectedTemplate.sample_content && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Content
                  </label>
                  <div className="bg-blue-50 rounded p-4 border border-blue-200">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                      {selectedTemplate.sample_content}
                    </pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTemplate.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTemplate.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDelete(selectedTemplate.id);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      <AddDLTTemplateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadTemplates();
        }}
      />

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit DLT Template</h2>
                <p className="text-sm text-gray-600 mt-1">{editingTemplate.template_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.template_name}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, template_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.template_id}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, template_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingTemplate.template_type}
                    onChange={(e) =>
                      handleTemplateTypeChange(e.target.value as 'Promotional' | 'Service')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Promotional">Promotional</option>
                    <option value="Service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingTemplate.header}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, header: e.target.value })
                    }
                    disabled={loadingHeaders}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    required
                  >
                    <option value="">
                      {loadingHeaders ? 'Loading headers...' : 'Select Header'}
                    </option>
                    {availableHeaders.map((header) => (
                      <option key={header.id} value={header.header}>
                        {header.header}
                      </option>
                    ))}
                  </select>
                  {availableHeaders.length === 0 && !loadingHeaders && (
                    <p className="text-xs text-amber-600 mt-1">
                      No approved headers found for {editingTemplate.template_type}. Please create one first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={editingTemplate.provider}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, provider: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Provider (Optional)</option>
                    <option value="Fast2SMS">Fast2SMS</option>
                    <option value="MSG91">MSG91</option>
                    <option value="Mock">Mock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingTemplate.status}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Registered">Registered</option>
                    <option value="Created">Created</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variable Count
                  </label>
                  <input
                    type="number"
                    value={editingTemplate.variable_count}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        variable_count: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingTemplate.template_content}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, template_content: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter template with {#var#} placeholders..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{#var#}'} for variables and {'{#alp#}'} for alphanumeric placeholders
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Content
                </label>
                <textarea
                  value={editingTemplate.sample_content || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, sample_content: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter a sample message with actual values..."
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      ) : (
        <SMSHeadersManagement />
      )}
    </div>
  );
};

export default TeleMarketerManagement;
