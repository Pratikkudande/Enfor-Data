import React from 'react';
import { X } from 'lucide-react';
import { CreateExternalBrokerRequest } from '../../../services/externalBrokerApi';

interface ExternalBrokerModalProps {
  isOpen: boolean;
  isViewOnly: boolean;
  isEditing: boolean;
  formData: CreateExternalBrokerRequest;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onFormChange: (data: Partial<CreateExternalBrokerRequest>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ExternalBrokerModal: React.FC<ExternalBrokerModalProps> = ({
  isOpen,
  isViewOnly,
  isEditing,
  formData,
  error,
  submitting,
  onClose,
  onFormChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {isViewOnly ? 'Broker Details' : isEditing ? 'Edit External Broker' : 'Add External Broker'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => onFormChange({ name: e.target.value })}
                disabled={isViewOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Broker's full name"
                required={!isViewOnly}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile_number}
                onChange={e => onFormChange({ mobile_number: e.target.value.replace(/\D/g, '') })}
                disabled={isViewOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter phone number"
                required={!isViewOnly}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Area</label>
              <input
                type="text"
                value={formData.area || ''}
                onChange={e => onFormChange({ area: e.target.value })}
                disabled={isViewOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Operating area (e.g., Andheri West)"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => onFormChange({ location: e.target.value })}
                disabled={isViewOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="City/region"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={e => onFormChange({ notes: e.target.value })}
                disabled={isViewOnly}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 resize-none"
                placeholder="Additional notes or comments"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!isViewOnly && (
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update' : 'Add Broker'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
