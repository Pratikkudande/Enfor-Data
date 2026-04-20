import React from 'react';
import { Building2, Sofa, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { StepProps } from './types';

const Step1Category: React.FC<StepProps> = ({ formData, errors, handleInputChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'property', label: 'Property', icon: Building2, color: 'from-blue-500 to-cyan-500' },
            { value: 'furniture', label: 'Furniture', icon: Sofa, color: 'from-green-500 to-emerald-500' },
            { value: 'staff', label: 'Staff', icon: Users, color: 'from-orange-500 to-amber-500' }
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => handleInputChange('category', cat.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  formData.category === cat.value
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {cat.value === 'property' && 'Real estate listings'}
                    {cat.value === 'furniture' && 'Furniture & equipment'}
                    {cat.value === 'staff' && 'Job opportunities'}
                  </div>
                </div>
                {formData.category === cat.value && (
                  <div className="mt-3">
                    <CheckCircle className="h-6 w-6 text-blue-600 mx-auto" />
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

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'sale', label: 'For Sale', desc: 'Selling items or property' },
            { value: 'rent', label: 'For Rent', desc: 'Renting out items or property' },
            { value: 'requirement', label: 'Requirement', desc: 'Looking for something' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => handleInputChange('subcategory', type.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                formData.subcategory === type.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{type.label}</span>
                {formData.subcategory === type.value && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <p className="text-xs text-gray-600">{type.desc}</p>
            </button>
          ))}
        </div>
        {errors.subcategory && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.subcategory}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1Category;
