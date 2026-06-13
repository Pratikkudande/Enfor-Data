import React, { useEffect, useRef, useState } from 'react';
import { X, Building2, Calendar, AlertCircle, Loader2, Users, Search, ChevronDown, Check } from 'lucide-react';
import { Agreement, PropertyOption, ClientOption } from '../../types';
import { apiClient } from '../../services/api';

interface Props {
  onClose: () => void;
  onCreate: (agreement: Agreement) => void;
}

interface FormData {
  property_id: string;
  client_id: string;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  property_id?: string;
  start_date?: string;
  end_date?: string;
}

const AgreementFormModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Client searchable dropdown state
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    property_id: '',
    client_id: '',
    start_date: '',
    end_date: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch properties and clients in parallel
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Lightweight options endpoints (just the fields the dropdowns need).
        const [propsRes, clientsRes] = await Promise.all([
          apiClient.getPropertyOptions(),
          apiClient.getClientOptions(),
        ]);
        setProperties(propsRes.data || []);
        setClients(clientsRes.data || []);
      } catch {
        setFormError('Could not load data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Close client dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredClients = clients.filter((c) => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const q = clientSearch.toLowerCase();
    return fullName.includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  const selectedClient = clients.find((c) => c.id === formData.client_id) ?? null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.property_id) newErrors.property_id = 'Please select a property.';
    if (!formData.start_date) newErrors.start_date = 'Start date is required.';
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

  const handleSelectClient = (clientId: string) => {
    setFormData((prev) => ({ ...prev, client_id: clientId }));
    setClientDropdownOpen(false);
    setClientSearch('');
  };

  const handleClearClient = () => {
    setFormData((prev) => ({ ...prev, client_id: '' }));
    setClientSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await apiClient.createAgreement({
        property_id: formData.property_id,
        client_id: formData.client_id || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      if (response.data) {
        onCreate(response.data);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const durationDays =
    formData.start_date && formData.end_date && formData.end_date > formData.start_date
      ? Math.ceil(
          (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
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

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1">
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
              {loadingData ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
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

            {/* Client searchable dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Client
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
              </label>

              <div className="relative" ref={clientDropdownRef}>
                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!loadingData && clients.length > 0) {
                      setClientDropdownOpen((o) => !o);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm bg-white transition-colors ${
                    loadingData || clients.length === 0
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <span className={selectedClient ? 'text-gray-900' : 'text-gray-400'}>
                    {loadingData
                      ? 'Loading clients…'
                      : clients.length === 0
                      ? 'No clients available'
                      : selectedClient
                      ? `${selectedClient.first_name} ${selectedClient.last_name}`
                      : 'Search and select a client…'}
                  </span>
                  <div className="flex items-center gap-1">
                    {selectedClient && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleClearClient(); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleClearClient()}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown panel */}
                {clientDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by name, phone or email…"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {filteredClients.length === 0 ? (
                        <li className="px-3 py-3 text-sm text-gray-400 text-center">
                          No clients match "{clientSearch}"
                        </li>
                      ) : (
                        filteredClients.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectClient(c.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                                formData.client_id === c.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {c.first_name} {c.last_name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{c.phone} · {c.email}</p>
                              </div>
                              {formData.client_id === c.id && (
                                <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                              )}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
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
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && (
                  <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
                )}
              </div>

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
                  min={formData.start_date || undefined}
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
            {durationDays !== null && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-blue-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                Agreement duration:{' '}
                <span className="font-semibold">{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 pt-1 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loadingData || properties.length === 0}
                className="flex-1 px-4 py-2.5 btn-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
};

export default AgreementFormModal;
