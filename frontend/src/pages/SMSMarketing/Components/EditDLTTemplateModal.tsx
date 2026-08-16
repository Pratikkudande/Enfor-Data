import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { updateDLTTemplate, SMSDLTTemplate, getAvailableHeadersByType, SMSHeader } from '../../../services/smsMarketingApi';
import { useAuth } from '../../../context/AuthContext';

interface EditDLTTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: SMSDLTTemplate | null;
}

const EditDLTTemplateModal: React.FC<EditDLTTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  template 
}) => {
  const { user } = useAuth();
  const isBroker = user?.role === 'broker' || user?.role === 'channel_partner';

  const [formData, setFormData] = useState({
    header: '',
    template_id: '',
    template_name: '',
    template_type: 'Promotional' as 'Promotional' | 'Service',
    category: 'SERVICES' as 'FOR_SALE' | 'FOR_RENT' | 'FOR_BUY' | 'LIST_FOR_RENT' | 'SERVICES',
    provider: '',
    template_content: '',
    sample_content: '',
    status: 'Created',
    variable_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [availableHeaders, setAvailableHeaders] = useState<SMSHeader[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);

  useEffect(() => {
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
  }, [template]);

  // Load headers when template type changes or modal opens
  useEffect(() => {
    if (isOpen && formData.template_type) {
      loadAvailableHeaders(formData.template_type);
    }
  }, [formData.template_type, isOpen]);

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

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateTypeChange = (type: 'Promotional' | 'Service') => {
    setFormData((prev) => ({ ...prev, template_type: type, header: '' })); // Reset header when type changes
  };

  const countVariables = (content: string) => {
    // Count {#var#} or {#alp#} patterns
    const matches = content.match(/\{#\w+#\}/g);
    return matches ? matches.length : 0;
  };

  const handleTemplateContentChange = (value: string) => {
    handleChange('template_content', value);
    handleChange('variable_count', countVariables(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template) return;
    
    try {
      setLoading(true);
      
      // For brokers, always set status to "Created" when updating
      const updateData = isBroker 
        ? { ...formData, status: 'Created' }
        : formData;
      
      await updateDLTTemplate(template.id, updateData);
      alert('DLT Template updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Failed to update template: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit DLT Template</h2>
              <p className="text-sm text-gray-600">{template.template_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.template_name}
                onChange={(e) => handleChange('template_name', e.target.value)}
                placeholder="e.g., SalePropertyAlert"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {!isBroker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template ID
                </label>
                <input
                  type="text"
                  value={formData.template_id}
                  onChange={(e) => handleChange('template_id', e.target.value)}
                  placeholder="e.g., 1277178600920660252"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.template_type}
                onChange={(e) => handleTemplateTypeChange(e.target.value as 'Promotional' | 'Service')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Promotional">Promotional</option>
                <option value="Service">Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header / Entity ID <span className="text-red-500">*</span>
              </label>
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
                  No approved headers found for {formData.template_type}. Please create one first.
                </p>
              )}
            </div>

          {!isBroker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
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
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Content <span className="text-red-500">*</span>
            </label>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Content (Optional)
            </label>
            <textarea
              value={formData.sample_content}
              onChange={(e) => handleChange('sample_content', e.target.value)}
              placeholder="Property for Sale: 2BHK Apartment&#10;Details: ₹50,00,000&#10;Contact: 9876543210&#10;- ENFOR DATA"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {!isBroker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
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
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDLTTemplateModal;
