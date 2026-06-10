import React from 'react';
import { User, Phone, Mail, AlertCircle, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { StepProps, VENDOR_SUBCATEGORIES } from './types';

interface Step3Props extends StepProps {
  categoryInfo: any;
  CategoryIcon: any;
}

const Step3Contact: React.FC<Step3Props> = ({
  formData,
  errors,
  handleInputChange,
  categoryInfo,
  CategoryIcon,
}) => {
  const isVendor = formData.category === 'vendor';

  const vendorLabel =
    VENDOR_SUBCATEGORIES.find((v) => v.value === formData.subcategory)?.label ?? formData.subcategory;

  const categoryLabel =
    formData.category === 'furniture_office'
      ? 'Office Furniture'
      : formData.category === 'furniture_house'
      ? 'House Furniture'
      : formData.category === 'vendor'
      ? `Vendor — ${vendorLabel}`
      : 'Staff';

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className={`p-4 rounded-xl ${categoryInfo.bgColor} border ${categoryInfo.borderColor}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gradient-to-br ${categoryInfo.color} rounded-lg`}>
            <CategoryIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{formData.title}</div>
            <div className="text-sm text-gray-600">{categoryLabel}</div>
          </div>
          {formData.price && !isVendor && (
            <div className="text-right">
              <div className="font-bold text-gray-900">₹{Number(formData.price).toLocaleString('en-IN')}</div>
              {formData.subcategory === 'rent' && (
                <div className="text-xs text-gray-600">/month</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vendor: show collected details as a review summary */}
      {isVendor ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Review Vendor Details</h3>
          <p className="text-sm text-gray-600">
            Your vendor profile is ready to publish. Review the details below.
          </p>

          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {formData.contactPhone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{formData.contactPhone}</span>
              </div>
            )}
            {formData.contactWhatsapp && (
              <div className="flex items-center gap-3 px-4 py-3">
                <MessageCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{formData.contactWhatsapp}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">WhatsApp</span>
              </div>
            )}
            {formData.serviceArea && (
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{formData.serviceArea}</span>
              </div>
            )}
            {formData.contactEmail && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{formData.contactEmail}</span>
              </div>
            )}
            {formData.contactAddress && (
              <div className="flex items-start gap-3 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{formData.contactAddress}</span>
              </div>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <div className="font-semibold mb-1">Ready to publish</div>
              <div>Your vendor profile will be visible to all users and searchable by service area.</div>
            </div>
          </div>
        </div>
      ) : (
        /* Non-vendor: collect contact info */
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
          <p className="text-sm text-gray-600 mb-6">
            Provide your contact details so interested parties can reach you.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Full name"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.contactName ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.contactName && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.contactName}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
              {errors.contactPhone && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.contactPhone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.contactEmail ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.contactEmail && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.contactEmail}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">Privacy Notice</div>
                <div>
                  Your contact information will be visible to all users viewing this post.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3Contact;
