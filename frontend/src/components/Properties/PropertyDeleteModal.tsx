import React from 'react';
import { Trash2 } from 'lucide-react';
import { Property } from '../../types';

interface PropertyDeleteModalProps {
  property: Property;
  deleting: boolean;
  formError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const PropertyDeleteModal: React.FC<PropertyDeleteModalProps> = ({ property, deleting, formError, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Delete Property</h2>
        <p className="text-gray-600 mt-2">
          This will soft delete <span className="font-semibold text-gray-900">{property.title}</span>.
          The record stays in the database, but it will disappear from active property lists.
        </p>
        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDeleteModal;
