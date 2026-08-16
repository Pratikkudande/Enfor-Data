import React, { useState, useEffect } from 'react';
import { Plus, Shield, Edit2, Trash2 } from 'lucide-react';
import {
  getDLTTemplates,
  deleteDLTTemplate,
  SMSDLTTemplate,
} from '../../../services/smsMarketingApi';
import AddDLTTemplateModal from '../Components/AddDLTTemplateModal';
import { useAuth } from '../../../context/AuthContext';

const TemplatesTab: React.FC = () => {
  const { user } = useAuth();
  const isBroker = user?.role === 'broker' || user?.role === 'channel_partner';
  
  const [dltTemplates, setDltTemplates] = useState<SMSDLTTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDLTModal, setShowDLTModal] = useState(false);

  useEffect(() => {
    loadDLTTemplates();
  }, []);

  const loadDLTTemplates = async () => {
    try {
      setLoading(true);
      const data = await getDLTTemplates();
      setDltTemplates(data?.templates || []);
    } catch (error) {
      console.error('Failed to load DLT templates:', error);
      setDltTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDLT = async (id: string) => {
    if (!confirm('Are you sure you want to delete this DLT template?')) return;
    try {
      await deleteDLTTemplate(id);
      loadDLTTemplates();
    } catch (error: any) {
      alert('Failed to delete DLT template: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditDLT = (template: SMSDLTTemplate) => {
    // TODO: Implement edit functionality if needed
    console.log('Edit template:', template);
  };

  const canEditOrDelete = (template: SMSDLTTemplate) => {
    // Admin can edit/delete all templates
    if (user?.role === 'admin') {
      return true;
    }
    
    // Brokers can only edit/delete their own templates with status "Created" or "Rejected"
    if (isBroker) {
      const isOwner = template.user_id === user?.id;
      const canEdit = template.status === 'Created' || template.status === 'Rejected';
      return isOwner && canEdit;
    }
    
    return false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created':
        return 'bg-green-100 text-gray-800';
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
        {/* DLT Templates */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">DLT Templates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Regulatory compliant SMS templates approved by telecom providers
            </p>
          </div>
          <button
            onClick={() => setShowDLTModal(true)}
            className="flex items-center gap-2 px-4 py-2 btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add DLT Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dltTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(template.status)}`}>
                      {template.status}
                    </span>
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {template.template_type}
                    </span>
                    {template.category && (
                      <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                        {getCategoryLabel(template.category)}
                      </span>
                    )}
                  </div>
                </div>
                {canEditOrDelete(template) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDLT(template)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Edit template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDLT(template.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {template.template_content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Header:</span> {template.header}
                </div>
                <div>
                  <span className="font-medium">Variables:</span> {template.variable_count}
                </div>
              </div>
              <div className="text-xs">
                  <span className="font-medium">Template ID:</span> {template.id}
              </div>
               
            </div>
          ))}
        </div>

        {dltTemplates.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No DLT templates yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Add your first DLT template to send compliant promotional SMS
            </p>
          </div>
        )}

        {/* Add DLT Template Modal */}
        <AddDLTTemplateModal
          isOpen={showDLTModal}
          onClose={() => setShowDLTModal(false)}
          onSuccess={() => {
            loadDLTTemplates();
          }}
        />
      </div>
    </div>
  );
};

export default TemplatesTab;
