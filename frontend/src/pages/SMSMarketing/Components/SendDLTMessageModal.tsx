import React, { useState, useEffect } from 'react';
import { X, Send, Users, FileText, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { SMSDLTTemplate, sendDLTMessage } from '../../../services/smsMarketingApi';
import { clientApi, Client } from '../../../services/clientApi';

interface SendDLTMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: SMSDLTTemplate | null;
  onSuccess: () => void;
}

interface MessageTemplate {
  id: string;
  variableValues: Record<string, string>;
  showPreview: boolean;
}

const SendDLTMessageModal: React.FC<SendDLTMessageModalProps> = ({
  isOpen,
  onClose,
  template,
  onSuccess,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'buyer' | 'seller' | 'tenant' | 'list_property_for_rent'>('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      if (template) {
        // Initialize with one message template
        const vars: Record<string, string> = {};
        for (let i = 0; i < template.variable_count; i++) {
          vars[`var${i + 1}`] = '';
        }
        setMessageTemplates([{
          id: Date.now().toString(),
          variableValues: vars,
          showPreview: false
        }]);
        setSelectedClients([]);
      }
    }
  }, [isOpen, template]);

  const loadClients = async () => {
    try {
      const data = await clientApi.getClients();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const addMessageTemplate = () => {
    if (!template) return;
    
    const vars: Record<string, string> = {};
    for (let i = 0; i < template.variable_count; i++) {
      vars[`var${i + 1}`] = '';
    }
    
    setMessageTemplates([...messageTemplates, {
      id: Date.now().toString(),
      variableValues: vars,
      showPreview: false
    }]);
  };

  const removeMessageTemplate = (id: string) => {
    if (messageTemplates.length === 1) {
      alert('You must have at least one message template');
      return;
    }
    setMessageTemplates(messageTemplates.filter(mt => mt.id !== id));
  };

  const togglePreview = (templateId: string) => {
    setMessageTemplates(messageTemplates.map(mt => {
      if (mt.id === templateId) {
        return { ...mt, showPreview: !mt.showPreview };
      }
      return mt;
    }));
  };

  const updateVariableValue = (templateId: string, varName: string, value: string) => {
    setMessageTemplates(messageTemplates.map(mt => {
      if (mt.id === templateId) {
        return {
          ...mt,
          variableValues: { ...mt.variableValues, [varName]: value }
        };
      }
      return mt;
    }));
  };

  const getPreviewMessage = (variableValues: Record<string, string>) => {
    if (!template) return '';

    let preview = template.template_content;
    
    // Replace variables with their values
    let varIndex = 1;
    preview = preview.replace(/\{#\w+#\}/g, () => {
      const value = variableValues[`var${varIndex}`] || '';
      varIndex++;
      return value;
    });

    return preview;
  };

  const renderTemplateWithInputs = (messageTemplate: MessageTemplate) => {
    if (!template) return null;

    const content = template.template_content;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let varIndex = 1;

    // Regular expression to find variable placeholders
    const regex = /\{#\w+#\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the variable
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add input field for the variable
      const currentVarIndex = varIndex;
      parts.push(
        <input
          key={`var-${currentVarIndex}`}
          type="text"
          value={messageTemplate.variableValues[`var${currentVarIndex}`] || ''}
          onChange={(e) => updateVariableValue(messageTemplate.id, `var${currentVarIndex}`, e.target.value)}
          placeholder={`Var ${currentVarIndex}`}
          className="inline-block mx-1 px-2 py-1 border-b-2 border-blue-400 bg-blue-50 focus:outline-none focus:border-blue-600 focus:bg-blue-100 transition-colors min-w-[100px] text-blue-900 font-medium"
          style={{ width: `${Math.max(100, (messageTemplate.variableValues[`var${currentVarIndex}`] || '').length * 8 + 40)}px` }}
        />
      );

      lastIndex = match.index + match[0].length;
      varIndex++;
    }

    // Add remaining text after the last variable
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap">{parts}</div>;
  };

  const filteredClients = clients.filter(
    (client) => {
      const matchesSearch = 
        client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);
      
      const matchesType = clientTypeFilter === 'all' || client.type === clientTypeFilter;
      
      return matchesSearch && matchesType;
    }
  );

  const handleSelectClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'buyer': return 'Buyer';
      case 'seller': return 'Seller';
      case 'tenant': return 'Tenant';
      case 'list_property_for_rent': return 'Property Owner';
      default: return type;
    }
  };

  const handleSend = async () => {
    if (!template || selectedClients.length === 0) return;

    // Validate all message templates
    for (const mt of messageTemplates) {
      const allFilled = Object.values(mt.variableValues).every((val) => val.trim() !== '');
      if (!allFilled) {
        alert('Please fill in all variable values for all messages');
        return;
      }
    }

    try {
      setSending(true);
      let totalSuccessful = 0;
      let totalFailed = 0;

      // Send each message template to the same recipients
      for (const mt of messageTemplates) {
        const result = await sendDLTMessage({
          template_id: template.id,
          variable_values: mt.variableValues,
          client_ids: selectedClients,
        });
        
        totalSuccessful += result.data.successful;
        totalFailed += result.data.failed;
      }

      alert(
        `Multiple DLT SMS sent!\nTotal Successful: ${totalSuccessful}\nTotal Failed: ${totalFailed}`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Failed to send SMS: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send Multiple SMS with DLT Template</h2>
            <p className="text-sm text-gray-600 mt-1">{template.template_name} - {messageTemplates.length} message(s)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Recipient Selection */}
            <div className="bg-white rounded-lg border-2 border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Recipients ({selectedClients.length} selected)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  All messages will be sent to these recipients
                </p>
              </div>

              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Client Type Filter Buttons */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setClientTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      clientTypeFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setClientTypeFilter('buyer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      clientTypeFilter === 'buyer'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Buyer
                  </button>
                  <button
                    onClick={() => setClientTypeFilter('seller')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      clientTypeFilter === 'seller'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Seller
                  </button>
                  <button
                    onClick={() => setClientTypeFilter('tenant')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      clientTypeFilter === 'tenant'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    Tenant
                  </button>
                  <button
                    onClick={() => setClientTypeFilter('list_property_for_rent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      clientTypeFilter === 'list_property_for_rent'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Property Owner
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedClients.length === filteredClients.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No clients found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {clientTypeFilter !== 'all' ? `No ${getTypeLabel(clientTypeFilter).toLowerCase()}s available` : 'Try adjusting your search'}
                    </p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => handleSelectClient(client.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 text-sm">
                            {client.first_name} {client.last_name}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            client.type === 'buyer' ? 'bg-blue-100 text-blue-700' :
                            client.type === 'seller' ? 'bg-green-100 text-green-700' :
                            client.type === 'tenant' ? 'bg-orange-100 text-orange-700' :
                            client.type === 'list_property_for_rent' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {getTypeLabel(client.type)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{client.phone}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Message Templates */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Message Templates
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Create different message variations to send to the same recipients
                </p>
              </div>

              {/* Message Templates List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {messageTemplates.map((messageTemplate, index) => (
                  <div key={messageTemplate.id} className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                    {/* Message Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 flex items-center justify-between border-b border-blue-200">
                      <h4 className="font-semibold text-blue-900 text-sm">Message #{index + 1}</h4>
                      {messageTemplates.length > 1 && (
                        <button
                          onClick={() => removeMessageTemplate(messageTemplate.id)}
                          className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Template Preview with Toggle */}
                    <div className="p-4">
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Template Text Preview
                          </h5>
                          <button
                            onClick={() => togglePreview(messageTemplate.id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              messageTemplate.showPreview
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {messageTemplate.showPreview ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Edit
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                Preview
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm text-gray-800 leading-relaxed min-h-[120px]">
                          {messageTemplate.showPreview ? (
                            // Preview Mode
                            <div className="whitespace-pre-wrap">
                              {getPreviewMessage(messageTemplate.variableValues) || (
                                <span className="text-gray-400 italic">Fill in variables to see preview</span>
                              )}
                            </div>
                          ) : (
                            // Edit Mode
                            renderTemplateWithInputs(messageTemplate)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Message Button */}
                <button
                  onClick={addMessageTemplate}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedClients.length === 0 || messageTemplates.some(mt => Object.values(mt.variableValues).some(v => !v.trim()))}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send {messageTemplates.length} message(s) to {selectedClients.length} recipient(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDLTMessageModal;
