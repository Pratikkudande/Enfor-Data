import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Home, MapPin, IndianRupee, User, Phone, Calendar, FileText } from 'lucide-react';
import { ClientRequirement, clientRequirementApi } from '../../../services/clientRequirementApi';
import { clientApi, Client } from '../../../services/clientApi';

interface RequirementDetailModalProps {
  requirement: ClientRequirement;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ENQUIRY_OPTIONS = [
  'Single Room', 'PG', '1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK',
  '3 BHK', '3.5 BHK', '4 BHK', '5 BHK', '6 BHK', 'ROW House Bungalow',
  'Shops', 'Office'
];

const RequirementDetailModal: React.FC<RequirementDetailModalProps> = ({
  requirement,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(requirement);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (isOpen && isEditing) {
      loadClients();
    }
  }, [isOpen, isEditing]);

  useEffect(() => {
    setEditedData(requirement);
  }, [requirement]);

  const loadClients = async () => {
    try {
      const data = await clientApi.getClients();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await clientRequirementApi.updateRequirement(requirement.id, editedData);
      alert('Requirement updated successfully!');
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Failed to update: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Requirement Details</h2>
            <p className="text-sm text-gray-600">{requirement.client_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditedData(requirement);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Client Information</h3>
            {isEditing ? (
              <div>
                <label className="text-sm text-gray-600">Select Client *</label>
                <select
                  value={editedData.client_id}
                  onChange={(e) => {
                    const selectedClient = clients.find(c => c.id === e.target.value);
                    setEditedData({
                      ...editedData,
                      client_id: e.target.value,
                      client_name: selectedClient?.name || '',
                      client_phone: selectedClient?.phone || '',
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{requirement.client_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{requirement.client_phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Requirement Details */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Requirement Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                {isEditing ? (
                  <select
                    value={editedData.requirement_type}
                    onChange={(e) => setEditedData({ ...editedData, requirement_type: e.target.value as 'buy' | 'rent' })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="buy">Buy</option>
                    <option value="rent">Rent</option>
                  </select>
                ) : (
                  <p className="text-gray-900 mt-1 capitalize">{requirement.requirement_type}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                {isEditing ? (
                  <select
                    value={editedData.status}
                    onChange={(e) => setEditedData({ ...editedData, status: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <p className="text-gray-900 mt-1 capitalize">{requirement.status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="text-sm text-gray-600">Property Type</label>
            {isEditing ? (
              <select
                value={editedData.enquiry || ''}
                onChange={(e) => setEditedData({ ...editedData, enquiry: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="">Select property type</option>
                {ENQUIRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Home className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{requirement.enquiry || 'Not specified'}</span>
              </div>
            )}
          </div>

          {/* Budget */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Budget</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Min Budget</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.min_budget || ''}
                    onChange={(e) => setEditedData({ ...editedData, min_budget: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Min budget"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">
                    {requirement.min_budget ? `₹${requirement.min_budget.toLocaleString()}` : 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Max Budget</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.max_budget || ''}
                    onChange={(e) => setEditedData({ ...editedData, max_budget: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Max budget"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">
                    {requirement.max_budget ? `₹${requirement.max_budget.toLocaleString()}` : 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Deposit</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.deposit_budget || ''}
                    onChange={(e) => setEditedData({ ...editedData, deposit_budget: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Deposit"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">
                    {requirement.deposit_budget ? `₹${requirement.deposit_budget.toLocaleString()}` : 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Area */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Area Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Buildup Area</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.buildup_area || ''}
                    onChange={(e) => setEditedData({ ...editedData, buildup_area: parseInt(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Buildup area"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">
                    {requirement.buildup_area ? `${requirement.buildup_area} ${requirement.measurement_unit}` : 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Carpet Area</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedData.carpet_area || ''}
                    onChange={(e) => setEditedData({ ...editedData, carpet_area: parseInt(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="Carpet area"
                  />
                ) : (
                  <p className="text-gray-900 mt-1">
                    {requirement.carpet_area ? `${requirement.carpet_area} ${requirement.measurement_unit}` : 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Unit</label>
                {isEditing ? (
                  <select
                    value={editedData.measurement_unit || 'sq_foot'}
                    onChange={(e) => setEditedData({ ...editedData, measurement_unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="sq_foot">Sq Foot</option>
                    <option value="sq_meter">Sq Meter</option>
                    <option value="acre">Acre</option>
                    <option value="guntha">Guntha</option>
                  </select>
                ) : (
                  <p className="text-gray-900 mt-1 capitalize">{requirement.measurement_unit?.replace('_', ' ') || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Preferred Location</label>
                  <input
                    type="text"
                    value={editedData.preferred_location || ''}
                    onChange={(e) => setEditedData({ ...editedData, preferred_location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    placeholder="e.g., Near Railway Station"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">City</label>
                    <input
                      type="text"
                      value={editedData.city || ''}
                      onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">State</label>
                    <input
                      type="text"
                      value={editedData.state || ''}
                      onChange={(e) => setEditedData({ ...editedData, state: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Postal Code</label>
                    <input
                      type="text"
                      value={editedData.postal_code || ''}
                      onChange={(e) => setEditedData({ ...editedData, postal_code: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      placeholder="Postal Code"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-gray-900">{requirement.preferred_location || 'Not specified'}</p>
                  {(requirement.city || requirement.state) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {[requirement.city, requirement.state, requirement.postal_code].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Additional Notes</h3>
            {isEditing ? (
              <textarea
                value={editedData.notes || ''}
                onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Add any additional notes or requirements..."
              />
            ) : (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-500 mt-1" />
                <p className="text-gray-700">{requirement.notes || 'No additional notes'}</p>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t">
            <Calendar className="w-4 h-4" />
            <span>Created on {new Date(requirement.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementDetailModal;
