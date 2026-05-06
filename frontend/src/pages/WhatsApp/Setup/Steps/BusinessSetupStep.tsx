import React, { useState } from 'react';
import { Building2, Phone, Globe, Tag } from 'lucide-react';
import { api } from '../../../../services/apiClient';

interface BusinessSetupStepProps {
  onComplete: (data: any) => void;
}

const BusinessSetupStep: React.FC<BusinessSetupStepProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    phone_number: '',
    business_name: '',
    business_description: '',
    business_category: 'Real Estate',
    business_website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Real Estate',
    'Property Management',
    'Real Estate Agency',
    'Commercial Real Estate',
    'Residential Real Estate',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/whatsapp/setup/business', formData);
      
      if (response.data) {
        onComplete(formData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to initialize business setup');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Information</h2>
        <p className="text-gray-600">
          Tell us about your business to set up your WhatsApp Business Account
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline h-4 w-4 mr-1" />
            WhatsApp Business Phone Number *
          </label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="+919876543210"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Include country code (e.g., +91 for India)
          </p>
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="inline h-4 w-4 mr-1" />
            Business Name *
          </label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            placeholder="My Real Estate Business"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Business Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="inline h-4 w-4 mr-1" />
            Business Category *
          </label>
          <select
            name="business_category"
            value={formData.business_category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Business Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description
          </label>
          <textarea
            name="business_description"
            value={formData.business_description}
            onChange={handleChange}
            placeholder="Brief description of your business..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Business Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="inline h-4 w-4 mr-1" />
            Business Website
          </label>
          <input
            type="url"
            name="business_website"
            value={formData.business_website}
            onChange={handleChange}
            placeholder="https://mywebsite.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              'Continue to Verification'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSetupStep;
