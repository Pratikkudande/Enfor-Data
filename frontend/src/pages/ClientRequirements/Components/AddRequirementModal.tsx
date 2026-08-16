import React, { useState, useEffect } from 'react';
import { X, Home } from 'lucide-react';
import { clientRequirementApi, CreateClientRequirementRequest } from '../../../services/clientRequirementApi';
import { clientApi, Client } from '../../../services/clientApi';

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClientId?: string;
}

const ENQUIRY_OPTIONS = [
  'Single Room', 'PG', '1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK',
  '3 BHK', '3.5 BHK', '4 BHK', '5 BHK', '6 BHK', 'ROW House Bungalow',
  'Shops', 'Office'
];

const AddRequirementModal: React.FC<AddRequirementModalProps> = ({ isOpen, onClose, onSuccess, initialClientId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<CreateClientRequirementRequest>({
    client_id: initialClientId || '',
    requirement_type: 'buy',
    buildup_area: undefined,
    carpet_area: undefined,
    measurement_unit: 'sq_foot',
    min_budget: undefined,
    max_budget: undefined,
    deposit_budget: undefined,
    preferred_location: '',
    city: '',
    state: '',
    postal_code: '',
    enquiry: '',
    notes: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      // Set the initial client ID if provided
      if (initialClientId) {
        setFormData((prev) => ({ ...prev, client_id: initialClientId }));
      }
    }
  }, [isOpen, initialClientId]);

  const loadClients = async () => {
    try {
      const data = await clientApi.getClients();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleChange = (field: keyof CreateClientRequirementRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    try {
      setLoading(true);
      await clientRequirementApi.createRequirement(formData);
      alert('Requirement added successfully!');
      onSuccess();
    } catch (error: any) {
      alert('Failed to add requirement: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Client Requirement</h2>
              <p className="text-sm text-gray-600">Create a new property requirement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleChange('client_id', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name} - {client.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirement Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.requirement_type}
                onChange={(e) => handleChange('requirement_type', e.target.value as 'buy' | 'rent')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type (Enquiry)
            </label>
            <select
              value={formData.enquiry}
              onChange={(e) => handleChange('enquiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Property Type</option>
              {ENQUIRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Area Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buildup Area
              </label>
              <input
                type="number"
                value={formData.buildup_area || ''}
                onChange={(e) => handleChange('buildup_area', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 1200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carpet Area
              </label>
              <input
                type="number"
                value={formData.carpet_area || ''}
                onChange={(e) => handleChange('carpet_area', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Unit
              </label>
              <select
                value={formData.measurement_unit}
                onChange={(e) => handleChange('measurement_unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sq_foot">Sq Foot</option>
                <option value="sq_meter">Sq Meter</option>
                <option value="acre">Acre</option>
                <option value="guntha">Guntha</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Budget (₹)
              </label>
              <input
                type="number"
                value={formData.min_budget || ''}
                onChange={(e) => handleChange('min_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 5000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Budget (₹)
              </label>
              <input
                type="number"
                value={formData.max_budget || ''}
                onChange={(e) => handleChange('max_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 10000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Budget (₹)
              </label>
              <input
                type="number"
                value={formData.deposit_budget || ''}
                onChange={(e) => handleChange('deposit_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 500000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Location
            </label>
            <input
              type="text"
              value={formData.preferred_location}
              onChange={(e) => handleChange('preferred_location', e.target.value)}
              placeholder="e.g., Andheri West, Near Station"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g., Mumbai"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="e.g., Maharashtra"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="e.g., 400053"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional requirements or preferences..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRequirementModal;
