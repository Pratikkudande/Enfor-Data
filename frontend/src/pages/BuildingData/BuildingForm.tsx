import React from 'react';

export interface BuildingFormData {
  ownerName: string;
  mobileNumber: string;
  buildingName: string;
  area: string;
  notes: string;
}

interface BuildingFormProps {
  formData: BuildingFormData;
  editingId: string | null;
  isViewOnly?: boolean;
  submitting: boolean;
  formError?: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const BuildingForm: React.FC<BuildingFormProps> = ({
  formData,
  editingId,
  isViewOnly = false,
  submitting,
  formError,
  onInputChange,
  onSubmit,
  onCancel,
}) => {
  const inputCls = (disabled = false) =>
    `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
      disabled ? 'bg-gray-50 text-gray-500' : ''
    }`;

  const label = (text: string, required = false) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isViewOnly ? 'View Building Contact' : editingId ? 'Edit Building Contact' : 'Add Building Contact'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              {label('Mobile Number', true)}
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={onInputChange}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              {label('Building Name')}
              <input
                type="text"
                name="buildingName"
                value={formData.buildingName}
                onChange={onInputChange}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="e.g. Sunrise Residency"
              />
            </div>

            <div>
              {label('Owner Name')}
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={onInputChange}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="Owner's full name"
              />
            </div>

            <div>
              {label('Area / Location')}
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={onInputChange}
                disabled={isViewOnly}
                className={inputCls(isViewOnly)}
                placeholder="e.g. Andheri West, Mumbai"
              />
            </div>

            <div>
              {label('Notes')}
              <textarea
                name="notes"
                value={formData.notes}
                onChange={onInputChange}
                disabled={isViewOnly}
                rows={3}
                className={inputCls(isViewOnly)}
                placeholder="Any additional information…"
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {isViewOnly ? 'Close' : 'Cancel'}
              </button>
              {!isViewOnly && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2.5 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {editingId ? 'Updating…' : 'Adding…'}
                    </>
                  ) : (
                    editingId ? 'Update Contact' : 'Add Contact'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuildingForm;
