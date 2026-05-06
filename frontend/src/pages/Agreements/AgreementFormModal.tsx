import React, { useEffect, useState } from 'react';
import { X, Building2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Agreement, Property } from '../../types';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onClose: () => void;
  onCreate: (agreement: Agreement) => void;
  userId: string;
}

interface FormData {
  property_id: string;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  property_id?: string;
  start_date?: string;
  end_date?: string;
}

const AgreementFormModal: React.FC<Props> = ({ onClose, onCreate, userId }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    property_id: '',
    start_date: '',
    end_date: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch only the current user's properties
  useEffect(() => {
    const fetchMyProperties = async () => {
      setLoadingProperties(true);
      try {
        const response = await apiClient.getProperties();
        setProperties(response.data || []);
      } catch {
        // Fallback: try getAllProperties and filter by broker_id
        try {
          const response = await apiClient.getAllProperties();
          const mine = (response.data || []).filter((p) => p.broker_id === userId);
          setProperties(mine);
        } catch {
          setFormError('Could not load properties. Please try again.');
        }
      } finally {
        setLoadingProperties(false);
      }
    };
    fetchMyProperties();
  }, [userId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.property_id) {
      newErrors.property_id = 'Please select a property.';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required.';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required.';
    } else if (formData.start_date && formData.end_date <= formData.start_date) {
      newErrors.end_date = 'End date must be after the start date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const selectedProperty = properties.find((p) => p.id === formData.property_id);
      const now = new Date().toISOString();

      const newAgreement: Agreement = {
        id: crypto.randomUUID(),
        property_id: formData.property_id,
        property_title: selectedProperty?.title,
        property_address: selectedProperty
          ? `${selectedProperty.address}, ${selectedProperty.city}`
          : undefined,
        broker_id: userId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'active',
        created_at: now,
        updated_at: now,
      };

      onCreate(newAgreement);
    } catch {
      setFormError('Failed to create agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Create Agreement</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Global error */}
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {formError}
            </div>
          )}

          {/* Property dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Property <span className="text-red-500">*</span>
            </label>
            {loadingProperties ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your properties…
              </div>
            ) : properties.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                No properties found. Add a property first.
              </div>
            ) : (
              <select
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                  errors.property_id ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select a property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.city}
                  </option>
                ))}
              </select>
            )}
            {errors.property_id && (
              <p className="mt-1 text-xs text-red-600">{errors.property_id}</p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Date <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                min={today}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.start_date ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
              )}
            </div>

            {/* End date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  End Date <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date || today}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.end_date ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Duration preview */}
          {formData.start_date && formData.end_date && formData.end_date > formData.start_date && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-blue-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              Agreement duration:{' '}
              <span className="font-semibold">
                {Math.ceil(
                  (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingProperties || properties.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Agreement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgreementFormModal;
