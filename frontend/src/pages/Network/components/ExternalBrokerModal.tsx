import React from 'react';
import { X, Edit2, Save } from 'lucide-react';
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
  onEditToggle?: () => void;
  onCancelEdit?: () => void;
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
  onEditToggle,
  onCancelEdit,
}) => {
  if (!isOpen) return null;

  const inputCls = (disabled = false) =>
    `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? (isViewOnly ? 'Broker Details' : 'Edit External Broker') : 'Add External Broker'}
            </h2>
            <div className="flex items-center gap-2">
              {/* Edit button — shown in view mode for an existing record */}
              {isEditing && isViewOnly && onEditToggle && (
                <button
                  onClick={onEditToggle}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}

              {/* Save / Cancel buttons — shown in edit mode for an existing record */}
              {isEditing && !isViewOnly && onCancelEdit && (
                <>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onSubmit(e as any)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => onFormChange({ name: e.target.value })}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="Broker's full name"
                required={!isViewOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile_number}
                onChange={e => onFormChange({ mobile_number: e.target.value.replace(/\D/g, '') })}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="Enter phone number"
                required={!isViewOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <input
                type="text"
                value={formData.area || ''}
                onChange={e => onFormChange({ area: e.target.value })}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="Operating area (e.g., Andheri West)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => onFormChange({ location: e.target.value })}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="City/region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={e => onFormChange({ notes: e.target.value })}
                disabled={isViewOnly}
                rows={3}
                className={inputCls(isViewOnly)}
                placeholder="Additional notes or comments"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Footer buttons only when adding a new broker */}
            {!isEditing && (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Adding…
                    </>
                  ) : (
                    'Add Broker'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
