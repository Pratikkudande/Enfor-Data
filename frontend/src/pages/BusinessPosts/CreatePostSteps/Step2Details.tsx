import React, { useRef } from 'react';
import {
  MapPin, IndianRupee, Upload, AlertCircle, Trash2,
  Phone, Mail, MessageCircle, Home, Star, FileText, X,
} from 'lucide-react';
import { StepProps, VENDOR_SUBCATEGORIES } from './types';

interface Step2Props extends StepProps {
  categoryInfo: any;
  CategoryIcon: any;
  imagePreviews: string[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
}

const inputCls = (hasError?: string) =>
  `w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
    hasError ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
  }`;

const ErrorMsg: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <div className="mt-1 flex items-center text-red-600 text-sm">
      <AlertCircle className="h-4 w-4 mr-1" />
      {msg}
    </div>
  ) : null;

const Step2Details: React.FC<Step2Props> = ({
  formData,
  errors,
  handleInputChange,
  onResumeChange,
  categoryInfo,
  CategoryIcon,
  imagePreviews,
  handleImageUpload,
  removeImage,
}) => {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const isVendor = formData.category === 'vendor';
  const isStaff = formData.category === 'staff';
  const isFurniture = formData.category === 'furniture_office' || formData.category === 'furniture_house';

  const vendorLabel = VENDOR_SUBCATEGORIES.find((v) => v.value === formData.subcategory)?.label ?? formData.subcategory;

  const categoryLabel =
    formData.category === 'furniture_office'
      ? 'Office Furniture'
      : formData.category === 'furniture_house'
      ? 'House Furniture'
      : formData.category === 'vendor'
      ? 'Vendor'
      : 'Staff';

  return (
    <div className="space-y-6">
      {/* Category badge */}
      <div className={`p-4 rounded-xl ${categoryInfo.bgColor} border ${categoryInfo.borderColor}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gradient-to-br ${categoryInfo.color} rounded-lg`}>
            <CategoryIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Creating post for</div>
            <div className="font-semibold text-gray-900">
              {categoryLabel}{formData.subcategory ? ` — ${isVendor ? vendorLabel : formData.subcategory}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isVendor ? 'Vendor / Business Name' : 'Post Title'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder={isVendor ? 'Enter vendor or business name' : 'Enter a descriptive title'}
          className={inputCls(errors.title)}
        />
        <ErrorMsg msg={errors.title} />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={
            isVendor
              ? 'Describe the services offered, experience, coverage area, etc.'
              : 'Provide detailed information about your post'
          }
          rows={4}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        <ErrorMsg msg={errors.description} />
        <div className="mt-1 text-xs text-gray-500">{formData.description.length} / 1000 characters</div>
      </div>

      {/* Price — not shown for vendor */}
      {!isVendor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {formData.subcategory === 'requirement' ? 'Budget (Optional)' : 'Price'}
              {formData.subcategory !== 'requirement' && <span className="text-red-500"> *</span>}
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value.replace(/[^\d]/g, ''))}
                placeholder={formData.subcategory === 'rent' ? 'Monthly rent' : 'Enter amount'}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.price ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
            <ErrorMsg msg={errors.price} />
            {formData.price && !errors.price && (
              <div className="mt-1 text-sm text-gray-600">
                ₹{Number(formData.price).toLocaleString('en-IN')}
                {formData.subcategory === 'rent' && '/month'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.location ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
            <ErrorMsg msg={errors.location} />
          </div>
        </div>
      )}

      {/* Vendor-specific fields */}
      {isVendor && (
        <div className="space-y-5 bg-purple-50 border border-purple-100 rounded-xl p-5">
          <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Vendor Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="Enter phone number"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.contactPhone ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>
              <ErrorMsg msg={errors.contactPhone} />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                <input
                  type="tel"
                  value={formData.contactWhatsapp}
                  onChange={(e) => handleInputChange('contactWhatsapp', e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Service Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Service Area / Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.serviceArea}
                onChange={(e) => handleInputChange('serviceArea', e.target.value)}
                placeholder="e.g. Koramangala, Indiranagar, Whitefield"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.serviceArea ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>
            <ErrorMsg msg={errors.serviceArea} />
            <p className="mt-1 text-xs text-gray-500">Enter areas/localities where you provide service (searchable)</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.contactAddress}
                onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                placeholder="Full business address"
                rows={2}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="vendor@example.com"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rating / Review
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const current = Number(formData.price) || 0; // reusing price field for rating in vendor context
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleInputChange('price', String(star))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= current ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
              {formData.price && (
                <span className="text-sm text-gray-600 ml-2">{formData.price} / 5</span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Optional — rate this vendor based on your experience</p>
          </div>
        </div>
      )}

      {/* Resume upload — Staff only (single file) */}
      {isStaff && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Resume / CV
            <span className="ml-1 text-gray-400 font-normal text-xs">(Optional — PDF, DOC, DOCX)</span>
          </label>

          {formData.resumeFile ? (
            /* File selected — show name + remove */
            <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{formData.resumeFile.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResumeChange?.(null);
                  if (resumeInputRef.current) resumeInputRef.current.value = '';
                }}
                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex-shrink-0"
                title="Remove resume"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* No file — show upload zone */
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <div className="text-sm font-medium text-gray-700 mb-1">Click to upload resume</div>
                <div className="text-xs text-gray-500">PDF, DOC, DOCX up to 10 MB</div>
              </div>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onResumeChange?.(file);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {/* Images — all categories except Staff */}
      {!isStaff && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {isVendor ? 'Photos (Optional) — Max 5' : 'Images (Optional) — Max 5'}
          </label>
          <div className="space-y-4">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <div className="text-sm font-medium text-gray-700 mb-1">Click to upload photos</div>
                  <div className="text-xs text-gray-500">
                    PNG, JPG up to 5MB ({5 - imagePreviews.length} remaining)
                  </div>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2Details;
