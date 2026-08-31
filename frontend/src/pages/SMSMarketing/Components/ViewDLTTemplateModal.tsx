import React, { useState, useEffect } from 'react';
import { X, FileText, Eye, Edit2, Save } from 'lucide-react';
import { SMSDLTTemplate, updateDLTTemplate, getAvailableHeadersByType, SMSHeader } from '../../../services/smsMarketingApi';
import { useAuth } from '../../../context/AuthContext';

interface ViewDLTTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: SMSDLTTemplate | null;
  onSuccess: () => void;
}

const ViewDLTTemplateModal: React.FC<ViewDLTTemplateModalProps> = ({ isOpen, onClose, template, onSuccess }) => {
  const { user } = useAuth();
  const isBroker = user?.role === 'broker' || user?.role === 'channel_partner';
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableHeaders, setAvailableHeaders] = useState<SMSHeader[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    header: '',
    template_id: '',
    template_name: '',
    template_type: 'Promotional' as 'Promotional' | 'Service',
    category: 'SERVICES',
    provider: '',
    template_content: '',
    sample_content: '',
    status: 'Created',
    variable_count: 0,
  });

  // Load form data when template changes
  useEffect(() => {
    if (template && isOpen) {
      setFormData({
        header: template.header,
        template_id: template.template_id || '',
        template_name: template.template_name,
        template_type: template.template_type,
        category: template.category,
        provider: template.provider || '',
        template_content: template.template_content,
        sample_content: template.sample_content || '',
        status: template.status,
        variable_count: template.variable_count,
      });
      setIsEditMode(false);
    }
  }, [template, isOpen]);

  // Load headers when template type changes in edit mode
  useEffect(() => {
    if (isEditMode && formData.template_type) {
      loadAvailableHeaders(formData.template_type);
    }
  }, [formData.template_type, isEditMode]);

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

  const canEdit = () => {
    if (!template) return false;
    
    // Admin can edit all templates
    if (user?.role === 'admin') {
      return true;
    }
    
    // Brokers can only edit their own templates with status "Created" or "Rejected"
    if (isBroker) {
      const isOwner = template.user_id === user?.id;
      const canEditStatus = template.status === 'Created' || template.status === 'Rejected';
      return isOwner && canEditStatus;
    }
    
    return false;
  };

  const handleEditToggle = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (template) {
      setFormData({
        header: template.header,
        template_id: template.template_id || '',
        template_name: template.template_name,
        template_type: template.template_type,
        category: template.category,
        provider: template.provider || '',
        template_content: template.template_content,
        sample_content: template.sample_content || '',
        status: template.status,
        variable_count: template.variable_count,
      });
    }
    setIsEditMode(false);
  };

  const countVariables = (content: string) => {
    const matches = content.match(/\{#\w+#\}/g);
    return matches ? matches.length : 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateContentChange = (value: string) => {
    handleChange('template_content', value);
    handleChange('variable_count', countVariables(value));
  };

  const handleTemplateTypeChange = (type: 'Promotional' | 'Service') => {
    setFormData((prev) => ({ ...prev, template_type: type, header: '' }));
  };

  const handleSave = async () => {
    if (!template) return;

    try {
      setLoading(true);
      await updateDLTTemplate(template.id, formData);
      alert('Template updated successfully!');
      setIsEditMode(false);
      onSuccess();
    } catch (error: any) {
      alert('Failed to update template: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !template) return null;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'FOR_SALE':
        return 'For Sale';
      case 'FOR_RENT':
        return 'For Rent';
      case 'FOR_BUY':
        return 'For Buy';
      case 'LIST_FOR_RENT':
        return 'List For Rent';
      case 'SERVICES':
        return 'Services';
      default:
        return category;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {isEditMode ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Eye className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? 'Edit DLT Template' : 'View DLT Template'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditMode ? 'Update template details' : 'Template details'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </>
            ) : (
              canEdit() && (
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Template Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type {isEditMode && <span className="text-red-500">*</span>}
              </label>
              {isEditMode ? (
                <select
                  value={formData.template_type}
                  onChange={(e) => handleTemplateTypeChange(e.target.value as 'Promotional' | 'Service')}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Promotional">Promotional</option>
                  <option value="Service">Service</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-900">{formData.template_type}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category {isEditMode && <span className="text-red-500">*</span>}
              </label>
              {isEditMode ? (
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="FOR_SALE">For Sale</option>
                  <option value="FOR_RENT">For Rent</option>
                  <option value="FOR_BUY">For Buy</option>
                  <option value="LIST_FOR_RENT">List For Rent</option>
                  <option value="SERVICES">Services</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-900">{getCategoryLabel(formData.category)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Header and Template Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header / Entity ID {isEditMode && <span className="text-red-500">*</span>}
              </label>
              {isEditMode ? (
                <>
                  <select
                    value={formData.header}
                    onChange={(e) => handleChange('header', e.target.value)}
                    required
                    disabled={loadingHeaders}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                      No approved headers found for {formData.template_type}
                    </p>
                  )}
                </>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-900">{formData.header}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name {isEditMode && <span className="text-red-500">*</span>}
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => handleChange('template_name', e.target.value)}
                  placeholder="e.g., SalePropertyAlert"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-900">{formData.template_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Template ID (if exists or in edit mode for admin) */}
          {(formData.template_id || (isEditMode && user?.role === 'admin')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template ID
              </label>
              {isEditMode && user?.role === 'admin' ? (
                <input
                  type="text"
                  value={formData.template_id}
                  onChange={(e) => handleChange('template_id', e.target.value)}
                  placeholder="e.g., 1277178600920660252"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-900 font-mono">{formData.template_id}</span>
                </div>
              )}
            </div>
          )}

          {/* Provider (if exists or in edit mode for admin) */}
          {(formData.provider || (isEditMode && user?.role === 'admin')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              {isEditMode && user?.role === 'admin' ? (
                <select
                  value={formData.provider}
                  onChange={(e) => handleChange('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Provider (Optional)</option>
                  <option value="MSG91">MSG91</option>
                  <option value="Fast2SMS">Fast2SMS</option>
                  <option value="JIO">JIO</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm text-gray-900">{formData.provider}</span>
                </div>
              )}
            </div>
          )}

          {/* Template Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content {isEditMode && <span className="text-red-500">*</span>}
            </label>
            {isEditMode ? (
              <>
                <textarea
                  value={formData.template_content}
                  onChange={(e) => handleTemplateContentChange(e.target.value)}
                  placeholder="Property for Sale: {#var#}&#10;Details: ₹{#var#}&#10;Contact: {#var#}&#10;- ENFOR DATA"
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{#var#}'} or {'{#alp#}'} for variable placeholders. Variables detected: {formData.variable_count}
                </p>
              </>
            ) : (
              <>
                <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                    {formData.template_content}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Variables detected: {formData.variable_count}
                </p>
              </>
            )}
          </div>

          {/* Sample Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Content {isEditMode && <span className="text-gray-500">(Optional)</span>}
            </label>
            {isEditMode ? (
              <textarea
                value={formData.sample_content}
                onChange={(e) => handleChange('sample_content', e.target.value)}
                placeholder="Property for Sale: 2BHK Apartment&#10;Details: ₹50,00,000&#10;Contact: 9876543210&#10;- ENFOR DATA"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            ) : formData.sample_content ? (
              <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                  {formData.sample_content}
                </pre>
              </div>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-400 italic">No sample content provided</span>
              </div>
            )}
          </div>

          {/* Status (only for admin in edit mode) */}
          {(user?.role === 'admin' || !isEditMode) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status {isEditMode && user?.role === 'admin' && <span className="text-red-500">*</span>}
              </label>
              {isEditMode && user?.role === 'admin' ? (
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Registered">Registered</option>
                  <option value="Approved">Approved</option>
                  <option value="Created">Created</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Rejected">Rejected</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                    formData.status === 'Active' || formData.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : formData.status === 'Created'
                      ? 'bg-blue-100 text-blue-800'
                      : formData.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Metadata (only in view mode) */}
          {!isEditMode && (
            <>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created At
                  </label>
                  <div className="text-sm text-gray-900">
                    {new Date(template.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Updated At
                  </label>
                  <div className="text-sm text-gray-900">
                    {new Date(template.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {template.created_by_name && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Created By
                  </label>
                  <div className="text-sm text-gray-900">
                    {template.created_by_name}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDLTTemplateModal;
