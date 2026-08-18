import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { SMSAccount, getAvailableDLTTemplates, SMSDLTTemplate } from '../../../services/smsMarketingApi';
import SendDLTMessageModal from '../Components/SendDLTMessageModal';

interface SendMessageTabProps {
  account: SMSAccount | null;
  onRefresh: () => void;
}

const SendMessageTab: React.FC<SendMessageTabProps> = ({ onRefresh }) => {
  const [dltTemplates, setDltTemplates] = useState<SMSDLTTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSDLTTemplate | null>(null);
  const [showDLTModal, setShowDLTModal] = useState(false);

  useEffect(() => {
    loadDLTTemplates();
  }, []);

  const loadDLTTemplates = async () => {
    try {
      const data = await getAvailableDLTTemplates();
      // The endpoint already filters for Active or Approved templates created by admin or broker
      setDltTemplates(data?.templates || []);
    } catch (error) {
      console.error('Failed to load DLT templates:', error);
      // Set empty array on error to prevent crashes
      setDltTemplates([]);
    }
  };

  const handleTemplateSelect = (template: SMSDLTTemplate) => {
    setSelectedTemplate(template);
    setShowDLTModal(true);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* DLT Template Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Choose DLT Template
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Select an approved template to send  SMS
            </p>
          </div>

          <div className="p-6">
            {dltTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active DLT templates found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Add DLT templates from the Templates tab
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dltTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            {template.template_type}
                          </span>
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                            {template.category.replace(/_/g, ' ')}
                          </span>
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                            {template.status}
                          </span>
                        </div>
                      </div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DLT Message Send Modal */}
      <SendDLTMessageModal
        isOpen={showDLTModal}
        onClose={() => {
          setShowDLTModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSuccess={() => {
          onRefresh();
          loadDLTTemplates();
        }}
      />
    </div>
  );
};

export default SendMessageTab;
