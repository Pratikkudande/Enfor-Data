import React from 'react';
import { Sofa, Users, CheckCircle, AlertCircle, Briefcase, Wrench, Home } from 'lucide-react';
import { StepProps, VENDOR_SUBCATEGORIES } from './types';

const CATEGORIES = [
  {
    value: 'furniture_office',
    label: 'Office Furniture',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-500',
    desc: 'Office furniture buy/sell',
  },
  {
    value: 'furniture_house',
    label: 'House Furniture',
    icon: Home,
    color: 'from-green-500 to-emerald-500',
    desc: 'Home furniture & services',
  },
  {
    value: 'vendor',
    label: 'Vendor',
    icon: Wrench,
    color: 'from-purple-500 to-violet-500',
    desc: 'Service vendors & providers',
  },
  {
    value: 'staff',
    label: 'Staff',
    icon: Users,
    color: 'from-orange-500 to-amber-500',
    desc: 'Job opportunities',
  },
] as const;

const FURNITURE_TYPES = [
  { value: 'sale', label: 'For Sale', desc: 'Selling furniture' },
  { value: 'rent', label: 'For Rent', desc: 'Renting out furniture' },
  { value: 'requirement', label: 'Requirement', desc: 'Looking for furniture' },
];

const STAFF_TYPES = [
  { value: 'sale', label: 'Available Staff', desc: 'Staff available for hire' },
  { value: 'requirement', label: 'Staff Required', desc: 'Looking for staff/recruitment' },
];

const Step1Category: React.FC<StepProps> = ({ formData, errors, handleInputChange }) => {
  const isVendor = formData.category === 'vendor';
  const isFurniture = formData.category === 'furniture_office' || formData.category === 'furniture_house';
  const isStaff = formData.category === 'staff';

  const subcategoryOptions = isVendor
    ? VENDOR_SUBCATEGORIES
    : isFurniture
    ? FURNITURE_TYPES
    : isStaff
    ? STAFF_TYPES
    : [];

  return (
    <div className="space-y-6">
      {/* Category selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const selected = formData.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  handleInputChange('category', cat.value);
                  handleInputChange('subcategory', '');
                }}
                className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                  selected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-sm">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{cat.desc}</div>
                </div>
                {selected && (
                  <div className="mt-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mx-auto" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {errors.category && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.category}
          </div>
        )}
      </div>

      {/* Subcategory selection — shown only after a category is picked */}
      {formData.category && subcategoryOptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isVendor ? 'Select Vendor Category' : 'Select Type'}
          </h3>
          <div className={`grid gap-3 ${isVendor ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            {subcategoryOptions.map((opt) => {
              const selected = formData.subcategory === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleInputChange('subcategory', opt.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{opt.label}</span>
                    {selected && <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              );
            })}
          </div>
          {errors.subcategory && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.subcategory}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step1Category;
