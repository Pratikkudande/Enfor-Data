import React from 'react';
import { BarChart3, Clock } from 'lucide-react';

interface ComingSoonViewProps {
  title?: string;
  description?: string;
}

const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  title = 'Analytics',
  description = 'Detailed insights and reports are on the way. We’re building powerful dashboards to help you track your business performance.',
}) => {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-6" />
          <div className="relative w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
          <Clock className="h-3.5 w-3.5" /> Coming Soon
        </span>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default ComingSoonView;
