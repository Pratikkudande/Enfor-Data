import React from 'react';
import { Plus } from 'lucide-react';
import { messageTemplates } from '../mockData';
import { getTypeColor } from '../utils';

const TemplatesTab: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      <div className="space-y-4">
        {messageTemplates.map((template) => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.category)}`}>
                {template.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{template.template}</p>
            <div className="flex space-x-2">
              <button className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-100 transition-colors">
                Use Template
              </button>
              <button className="bg-gray-50 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-100 transition-colors">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesTab;
