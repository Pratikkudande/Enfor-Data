import React from 'react';
import { Camera } from 'lucide-react';
import { PropertyFormData } from './types';
import { commonAmenities } from './constants';
import { indianStates } from '../../constants/options';
import { API_CONFIG } from '../../config/api';

interface PropertyFormModalProps {
  formMode: 'create' | 'edit';
  formData: PropertyFormData;
  validationErrors: Record<string, string>;
  formError: string | null;
  submitting: boolean;
  clients: any[];
  selectedAmenities: string[];
  currentPhotos?: string[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleTypeChange: (type: PropertyFormData['type']) => void;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  handleAmenityToggle: (amenity: string) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  onOpenPhotoUpload?: () => void;
  onClose: () => void;
}

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  formMode,
  formData,
  validationErrors,
  formError,
  submitting,
  clients,
  selectedAmenities,
  currentPhotos = [],
  handleInputChange,
  handleTypeChange,
  setFormData,
  handleAmenityToggle,
  handleFormSubmit,
  onOpenPhotoUpload,
  onClose
}) => {
  const getInputClass = (fieldName: string, baseClass: string) => (
    validationErrors[fieldName]
      ? `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500`
      : baseClass
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {formMode === 'create' ? 'Add New Property' : 'Edit Property'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formMode === 'create' ? 'Create a new listing for your catalog.' : 'Update listing details and status.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Property Type</label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'house', label: 'House' },
                  { value: 'row_house', label: 'Row House' },
                  { value: 'bungalow', label: 'Bungalow' },
                  { value: 'commercial', label: 'Commercial' },
                  { value: 'plot', label: 'Plot' },
                  { value: 'shop', label: 'Shop' },
                  { value: 'pg', label: 'PG' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value as PropertyFormData['type'])}
                    className={`p-2 border-2 rounded-lg text-center text-xs font-medium leading-tight transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Listing Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'sale', label: 'For Sale' },
                    { value: 'rent', label: 'For Rent' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, listingType: type.value as PropertyFormData['listingType'] }))}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        formData.listingType === type.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {formMode === 'edit' && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="hold">Hold</option>
                    <option value="closed">Closed</option>
                    <option value="under_discussion">Under Discussion</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Property Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={getInputClass('title', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
              placeholder="e.g., Luxury 3BHK Apartment in Bandra"
            />
            {validationErrors.title && <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={getInputClass('price', 'w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                  min="0"
                  step="1"
                />
              </div>
              {validationErrors.price && <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>}
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Area (sq ft) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={getInputClass('area', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                min="0"
                step="0.01"
              />
              {validationErrors.area && <p className="mt-1 text-sm text-red-600">{validationErrors.area}</p>}
            </div>
          </div>

          {(formData.type === 'apartment' || formData.type === 'house' || formData.type === 'row_house' || formData.type === 'pg' || formData.type === 'bungalow') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className={getInputClass('bedrooms', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                >
                  <option value="">Select Bedrooms</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5 BHK</option>
                  <option value="6">6+ BHK</option>
                </select>
                {validationErrors.bedrooms && <p className="mt-1 text-sm text-red-600">{validationErrors.bedrooms}</p>}
              </div>

              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className={getInputClass('bathrooms', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                >
                  <option value="">Select Bathrooms</option>
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                  <option value="4">4 Bathrooms</option>
                  <option value="5">5+ Bathrooms</option>
                </select>
                {validationErrors.bathrooms && <p className="mt-1 text-sm text-red-600">{validationErrors.bathrooms}</p>}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location Details</h3>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={getInputClass('location', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                placeholder="e.g., Bandra West, Mumbai"
              />
              {validationErrors.location && <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Complete Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={getInputClass('address', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                placeholder="Enter complete address with landmarks"
              />
              {validationErrors.address && <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={getInputClass('city', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                  placeholder="Mumbai"
                />
                {validationErrors.city && <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={getInputClass('state', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                >
                  <option value="">Select State</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {validationErrors.state && <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Linked Client
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Client (Optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Only your own clients are shown here.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Property Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={getInputClass('description', 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
              placeholder="Describe the property features, nearby amenities, and unique selling points..."
            />
            {validationErrors.description ? (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/20 characters minimum</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {commonAmenities.map((amenity) => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">{selectedAmenities.length} amenities selected</p>
          </div>

          {/* Property Photos Section */}
          {formMode === 'edit' && onOpenPhotoUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Property Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {currentPhotos.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                      {currentPhotos.slice(0, 4).map((photo, index) => (
                        <div key={photo} className="relative">
                          <img
                            src={`${API_CONFIG.BASE_URL}/uploads/${photo}`}
                            alt={`Property photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          {index === 3 && currentPhotos.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-medium">+{currentPhotos.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">{currentPhotos.length}/5 photos uploaded</p>
                      <button
                        type="button"
                        onClick={onOpenPhotoUpload}
                        className="btn-primary px-4 py-2 flex items-center mx-auto"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Manage Photos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No photos uploaded yet</p>
                    <button
                      type="button"
                      onClick={onOpenPhotoUpload}
                      className="btn-primary px-4 py-2 flex items-center mx-auto"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photos
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Upload up to 5 high-quality photos to showcase your property
                </p>
              </div>
            </div>
          )}

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800">
                {formMode === 'create' ? 'Error creating property' : 'Error updating property'}
              </h3>
              <p className="mt-1 text-sm text-red-700">{formError}</p>
            </div>
          )}

          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? 'Saving...' : formMode === 'create' ? 'Add Property' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyFormModal;
