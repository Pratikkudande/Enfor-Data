import React from 'react';
import { Search, Send, TrendingUp } from 'lucide-react';
import { templates } from '../mockData';

const TemplatesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option>All Categories</option>
          <option>WhatsApp</option>
          <option>Email</option>
          <option>Social Media</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {template.name}
                </h4>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {template.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {template.preview}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <Send className="h-4 w-4 mr-1" />
                  {template.uses}
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {template.engagement}%
                </div>
              </div>
              <button className="px-3 py-1.5 btn-secondary text-sm font-medium">
                Use
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesTab;
