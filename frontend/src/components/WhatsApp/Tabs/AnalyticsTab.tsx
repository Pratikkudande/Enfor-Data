import React from 'react';
import { BarChart3 } from 'lucide-react';

const AnalyticsTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
      <p className="text-gray-600">Detailed analytics and reporting features coming soon</p>
    </div>
  );
};

export default AnalyticsTab;
