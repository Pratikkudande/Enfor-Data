import React from 'react';
import { X, Edit2, Save } from 'lucide-react';
import { indianStates } from '../../constants/options';

export interface ClientFormData {
  firstName: string;
  lastName: string;
  location: string;
  contactNo: string;
  email: string;
  city: string;
  state: string;
  postalCode: string;
  budgetMin: string;
  budgetMax: string;
  types?: string[]; // Multiple types support
}

interface ClientFormProps {
  formData: ClientFormData;
  selectedClientType: 'buyer' | 'seller' | 'tenant' | 'list_property_for_rent';
  selectedClientTypes?: string[]; // Multiple types support
  editingClientId: string | null;
  isViewOnly?: boolean;
  submitting: boolean;
  formError?: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTypeChange: (type: 'buyer' | 'seller' | 'tenant' | 'list_property_for_rent') => void;
  onTypesChange?: (types: string[]) => void; // Multiple types support
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onEditToggle?: () => void;
  onCancelEdit?: () => void;
}

const typeConfig = {
  buyer:                  { label: 'Buy',             color: 'border-blue-500 bg-blue-50 text-blue-700',       inactive: 'border-gray-200 hover:border-blue-300'   },
  seller:                 { label: 'Sell',            color: 'border-green-500 bg-green-50 text-green-700',    inactive: 'border-gray-200 hover:border-green-300'  },
  tenant:                 { label: 'Rent',            color: 'border-orange-500 bg-orange-50 text-orange-700', inactive: 'border-gray-200 hover:border-orange-300' },
  list_property_for_rent: { label: 'Property Owner',  color: 'border-purple-500 bg-purple-50 text-purple-700', inactive: 'border-gray-200 hover:border-purple-300' },
};

const ClientForm: React.FC<ClientFormProps> = ({
  formData,
  selectedClientType,
  selectedClientTypes = [],
  editingClientId,
  isViewOnly = false,
  submitting,
  formError,
  onInputChange,
  onTypeChange,
  onTypesChange,
  onSubmit,
  onCancel,
  onEditToggle,
  onCancelEdit,
}) => {
  // Use selectedClientTypes if available, otherwise fall back to single type
  const activeTypes = selectedClientTypes.length > 0 ? selectedClientTypes : [selectedClientType];
  
  const isBuyer  = activeTypes.includes('buyer');
  const showBudgetRange = isBuyer || activeTypes.includes('tenant');

  // Handle type toggle for multi-select
  const handleTypeToggle = (type: 'buyer' | 'seller' | 'tenant' | 'list_property_for_rent') => {
    if (onTypesChange) {
      const newTypes = activeTypes.includes(type)
        ? activeTypes.filter(t => t !== type)
        : [...activeTypes, type];
      
      // Ensure at least one type is selected
      if (newTypes.length > 0) {
        onTypesChange(newTypes);
      }
    } else {
      onTypeChange(type);
    }
  };

  const inputCls = (disabled = false) =>
    `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-50 text-gray-500' : ''}`;

  const label = (text: string, required = false) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isViewOnly ? 'View Client' : editingClientId ? 'Edit Client' : 'Add New Client'}
            </h2>
            <div className="flex items-center gap-2">
              {editingClientId && isViewOnly && onEditToggle && (
                <button
                  onClick={onEditToggle}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
                </button>
              )}
              {editingClientId && !isViewOnly && (
                <>
                  <button
                    onClick={() => {
                      if (onCancelEdit) {
                        onCancelEdit();
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Client Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Client Type {!isViewOnly && <span className="text-gray-500 text-xs">(Select one or more)</span>}
            </label>
            {isViewOnly ? (
              <div className="flex flex-wrap gap-2">
                {activeTypes.map((type) => (
                  <div
                    key={type}
                    className={`px-4 py-2 border-2 rounded-lg text-center font-semibold text-sm ${
                      typeConfig[type as keyof typeof typeConfig].color
                    }`}
                  >
                    {typeConfig[type as keyof typeof typeConfig].label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((t) => {
                  const isSelected = activeTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeToggle(t)}
                      className={`p-3 border-2 rounded-lg text-center text-sm font-semibold transition-all ${
                        isSelected ? typeConfig[t].color : typeConfig[t].inactive
                      }`}
                    >
                      {typeConfig[t].label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (!isViewOnly) onSubmit(e); }} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label('First Name', true)}
                <input type="text" name="firstName" value={formData.firstName} onChange={onInputChange}
                  disabled={isViewOnly} maxLength={50} className={inputCls(isViewOnly)} required />
              </div>
              <div>
                {label('Last Name', true)}
                <input type="text" name="lastName" value={formData.lastName} onChange={onInputChange}
                  disabled={isViewOnly} maxLength={50} className={inputCls(isViewOnly)} required />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label('Contact No', true)}
                <input type="tel" name="contactNo" value={formData.contactNo} onChange={onInputChange}
                  disabled={isViewOnly} maxLength={10} className={inputCls(isViewOnly)} placeholder="Enter phone number" required />
              </div>
              <div>
                {label('Email ID')}
                <input type="email" name="email" value={formData.email} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} />
              </div>
            </div>

            {/* Location + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label('Preferred Location')}
                <input type="text" name="location" value={formData.location} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)}
                  placeholder="Area/Locality" />
              </div>
              <div>
                {label('City')}
                <input type="text" name="city" value={formData.city} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} />
              </div>
            </div>

            {/* State + Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label('State')}
                <select name="state" value={formData.state} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)}>
                  <option value="">Select State</option>
                  {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                {label('Postal Code')}
                <input type="text" name="postalCode" value={formData.postalCode} onChange={onInputChange}
                  disabled={isViewOnly} maxLength={6} className={inputCls(isViewOnly)} placeholder="400001" />
              </div>
            </div>

            {/* Budget Range — Buyer / Tenant */}
            {showBudgetRange && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {label('Min Budget')}
                  <input type="number" name="budgetMin" value={formData.budgetMin} onChange={onInputChange}
                    disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 1500000" />
                </div>
                <div>
                  {label('Max Budget')}
                  <input type="number" name="budgetMax" value={formData.budgetMax} onChange={onInputChange}
                    disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 3000000" />
                </div>
              </div>
            )}

            {/* Error */}
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            {/* Actions - Only show for Add New Client */}
            {!isViewOnly && !editingClientId && (
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={onCancel} disabled={submitting}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm font-medium">
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Adding...</>
                  ) : (
                    'Add Client'
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

export default ClientForm;
