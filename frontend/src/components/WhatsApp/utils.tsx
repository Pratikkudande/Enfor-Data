import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'read':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'sent':
      return <Clock className="h-4 w-4 text-orange-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'marketing':
      return 'bg-blue-100 text-blue-800';
    case 'appointment':
      return 'bg-green-100 text-green-800';
    case 'acknowledgment':
      return 'bg-purple-100 text-purple-800';
    case 'bulk':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
