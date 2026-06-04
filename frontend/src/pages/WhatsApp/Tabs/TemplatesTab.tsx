import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader, MessageSquare, AlertCircle } from 'lucide-react';
import { whatsappApi, MessageTemplate } from '../../../services/whatsappApi';
import { getTypeColor } from '../utils';

const TemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'general',
    template_text: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.getTemplates();
      setTemplates(response.templates || []);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.template_text.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      await whatsappApi.createTemplate({
        name: newTemplate.name,
        category: newTemplate.category,
        template_text: newTemplate.template_text,
      });
      
      setSuccess('Template created successfully!');
      setShowCreateModal(false);
      setNewTemplate({ name: '', category: 'general', template_text: '' });
      loadTemplates();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await whatsappApi.deleteTemplate(id);
      setSuccess('Template deleted successfully!');
      loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Template copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-4 py-2 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No templates yet</p>
            <p className="text-sm">Create your first message template to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.category)}`}>
                      {template.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Used {template.usage_count} times
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{template.template_text}</p>
                {template.variables && template.variables.length > 0 && (
                  <p className="text-xs text-gray-500 mb-3">
                    Variables: {template.variables.join(', ')}
                  </p>
                )}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => copyToClipboard(template.template_text)}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-100 transition-colors"
                  >
                    Copy Template
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-100 transition-colors flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., New Property Alert"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="marketing">Marketing</option>
                  <option value="appointment">Appointment</option>
                  <option value="acknowledgment">Acknowledgment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Text *
                </label>
                <textarea
                  value={newTemplate.template_text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template_text: e.target.value })}
                  placeholder="Enter your message template here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use variables like {'{name}'}, {'{property}'}, {'{date}'} for personalization
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplate({ name: '', category: 'general', template_text: '' });
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 btn-primary"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;
