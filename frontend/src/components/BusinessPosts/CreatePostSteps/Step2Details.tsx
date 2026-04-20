import React from 'react';
import { MapPin, IndianRupee, Upload, AlertCircle, Trash2 } from 'lucide-react';
import { StepProps } from './types';

interface Step2Props extends StepProps {
  categoryInfo: any;
  CategoryIcon: any;
  imagePreviews: string[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
}

const Step2Details: React.FC<Step2Props> = ({ 
  formData, 
  errors, 
  handleInputChange,
  categoryInfo,
  CategoryIcon,
  imagePreviews,
  handleImageUpload,
  removeImage
}) => {
  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl ${categoryInfo.bgColor} border ${categoryInfo.borderColor}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gradient-to-br ${categoryInfo.color} rounded-lg`}>
            <CategoryIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Creating post for</div>
            <div className="font-semibold text-gray-900 capitalize">
              {formData.category} - {formData.subcategory}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Post Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a catchy title for your post"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
            errors.title ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {errors.title && (
          <div className="mt-1 flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.title}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Provide detailed information about your post"
          rows={5}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {errors.description && (
          <div className="mt-1 flex items-center text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description}
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          {formData.description.length} / 1000 characters
        </div>
      </div>

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
          {errors.price && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.price}
            </div>
          )}
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
          {errors.location && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.location}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Images (Optional) - Max 5
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
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload images
                </div>
                <div className="text-xs text-gray-500">
                  PNG, JPG up to 5MB ({5 - imagePreviews.length} remaining)
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2Details;
