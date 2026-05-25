import React from 'react';
import { indianStates, enquiryOptions, measurementUnits } from '../../constants/options';

export interface ClientFormData {
  firstName: string;
  lastName: string;
  location: string;
  contactNo: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  enquiry: string;
  budgetMin: string;
  budgetMax: string;
  expectedAmount: string;
  // Sell Property
  minPrice: string;
  maxPrice: string;
  propertyAddress: string;
  // Area fields
  buildupArea: string;
  carpetArea: string;
  measurementUnit: string;
  // Rent
  depositBudget: string;
}

interface ClientFormProps {
  formData: ClientFormData;
  selectedClientType: 'buyer' | 'seller' | 'tenant' | 'list_property_for_rent';
  editingClientId: string | null;
  isViewOnly?: boolean;
  submitting: boolean;
  formError?: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTypeChange: (type: 'buyer' | 'seller' | 'tenant' | 'list_property_for_rent') => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const typeConfig = {
  buyer:                  { label: 'Buyer',              color: 'border-blue-500 bg-blue-50 text-blue-700',     inactive: 'border-gray-200 hover:border-blue-300'   },
  seller:                 { label: 'Sell Property',      color: 'border-green-500 bg-green-50 text-green-700',  inactive: 'border-gray-200 hover:border-green-300'  },
  tenant:                 { label: 'Rent Client',        color: 'border-orange-500 bg-orange-50 text-orange-700', inactive: 'border-gray-200 hover:border-orange-300' },
  list_property_for_rent: { label: 'Property for Rent',  color: 'border-purple-500 bg-purple-50 text-purple-700', inactive: 'border-gray-200 hover:border-purple-300' },
};

const ClientForm: React.FC<ClientFormProps> = ({
  formData,
  selectedClientType,
  editingClientId,
  isViewOnly = false,
  submitting,
  formError,
  onInputChange,
  onTypeChange,
  onSubmit,
  onCancel,
}) => {
  const isBuyer  = selectedClientType === 'buyer';
  const isSeller = selectedClientType === 'seller';
  const isTenant = selectedClientType === 'tenant';
  const isRentList = selectedClientType === 'list_property_for_rent';

  const showBudgetRange   = isBuyer || isTenant;
  const showExpected      = isRentList;
  const showSellPrices    = isSeller;
  const showAreaFields    = isBuyer || isSeller || isRentList;
  const showDeposit       = isTenant;
  const showPropertyAddr  = isSeller;

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
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Client Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Client Type</label>
            {isViewOnly ? (
              <div className={`p-3 border-2 rounded-lg text-center font-semibold text-sm ${typeConfig[selectedClientType].color}`}>
                {typeConfig[selectedClientType].label}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTypeChange(t)}
                    className={`p-3 border-2 rounded-lg text-center text-sm font-semibold transition-all ${
                      selectedClientType === t ? typeConfig[t].color : typeConfig[t].inactive
                    }`}
                  >
                    {typeConfig[t].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label('First Name', true)}
                <input type="text" name="firstName" value={formData.firstName} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} required />
              </div>
              <div>
                {label('Last Name', true)}
                <input type="text" name="lastName" value={formData.lastName} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} required />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label('Contact No', true)}
                <input type="tel" name="contactNo" value={formData.contactNo} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} placeholder="+91 9876543210" required />
              </div>
              <div>
                {label('Email ID', true)}
                <input type="email" name="email" value={formData.email} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} required />
              </div>
            </div>

            {/* Client Address — optional for all types */}
            <div>
              {label('Client Address')}
              <textarea name="address" value={formData.address} onChange={onInputChange}
                disabled={isViewOnly} rows={2} className={inputCls(isViewOnly)}
                placeholder="Client's residential address (optional)" />
            </div>

            {/* Sell Property: Property Address */}
            {showPropertyAddr && (
              <div>
                {label('Property Address', true)}
                <textarea name="propertyAddress" value={formData.propertyAddress} onChange={onInputChange}
                  disabled={isViewOnly} rows={2} className={inputCls(isViewOnly)}
                  placeholder="Full address of the property to be sold" required={!isViewOnly} />
              </div>
            )}

            {/* Location + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {label(isBuyer ? 'Preferred Location' : 'Property Location', true)}
                <input type="text" name="location" value={formData.location} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)}
                  placeholder={isBuyer ? 'Area/Locality' : 'Property area/location'} required />
              </div>
              <div>
                {label('City', true)}
                <input type="text" name="city" value={formData.city} onChange={onInputChange}
                  disabled={isViewOnly} className={inputCls(isViewOnly)} required />
              </div>
            </div>

            {/* State + Postal Code — optional */}
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
                  disabled={isViewOnly} className={inputCls(isViewOnly)} placeholder="400001" />
              </div>
            </div>

            {/* Enquiry */}
            <div>
              {label('Enquiry', true)}
              <select name="enquiry" value={formData.enquiry} onChange={onInputChange}
                disabled={isViewOnly} className={inputCls(isViewOnly)} required>
                <option value="">Select Property Type</option>
                {enquiryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Area fields — Buyer, Seller, Property for Rent */}
            {showAreaFields && (
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Area Details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    {label('Buildup Area')}
                    <input type="number" name="buildupArea" value={formData.buildupArea} onChange={onInputChange}
                      disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 1200" />
                  </div>
                  <div>
                    {label('Carpet Area')}
                    <input type="number" name="carpetArea" value={formData.carpetArea} onChange={onInputChange}
                      disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 950" />
                  </div>
                  <div>
                    {label('Measurement Unit')}
                    <select name="measurementUnit" value={formData.measurementUnit} onChange={onInputChange}
                      disabled={isViewOnly} className={inputCls(isViewOnly)}>
                      <option value="">Select Unit</option>
                      {measurementUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

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

            {/* Deposit Budget — Tenant */}
            {showDeposit && (
              <div>
                {label('Deposit Budget')}
                <input type="number" name="depositBudget" value={formData.depositBudget} onChange={onInputChange}
                  disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 100000" />
              </div>
            )}

            {/* Sell Property: Min/Max Price */}
            {showSellPrices && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {label('Minimum Price')}
                  <input type="number" name="minPrice" value={formData.minPrice} onChange={onInputChange}
                    disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 2000000" />
                </div>
                <div>
                  {label('Maximum Price')}
                  <input type="number" name="maxPrice" value={formData.maxPrice} onChange={onInputChange}
                    disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 5000000" />
                </div>
              </div>
            )}

            {/* Expected Amount — Property for Rent */}
            {showExpected && (
              <div>
                {label('Expected Amount')}
                <input type="number" name="expectedAmount" value={formData.expectedAmount} onChange={onInputChange}
                  disabled={isViewOnly} min="0" step="0.01" className={inputCls(isViewOnly)} placeholder="e.g. 2500000" />
              </div>
            )}

            {/* Error */}
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={onCancel} disabled={submitting}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium">
                {isViewOnly ? 'Close' : 'Cancel'}
              </button>
              {!isViewOnly && (
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm font-medium">
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {editingClientId ? 'Updating...' : 'Adding...'}</>
                  ) : (
                    editingClientId ? 'Update Client' : 'Add Client'
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

export default ClientForm;
