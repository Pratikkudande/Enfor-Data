import React, { useEffect, useState } from 'react';
import { Plus, Search, Building } from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Property } from '../../types';
import { apiClient, ClientOption, CreatePropertyRequest, UpdatePropertyRequest } from '../../services/api';
import { API_CONFIG } from '../../config/api';
import { PropertyFormData } from './types';
import { initialFormData } from './constants';
import { transformProperty, propertyToFormData } from './utils';
import PropertyCard from './PropertyCard';
import PropertyFormModal from './PropertyFormModal';
import PropertyViewModal from './PropertyViewModal';
import PropertyDeleteModal from './PropertyDeleteModal';
import PropertyPhotoUpload from './PropertyPhotoUpload';
import { useAuth } from '../../context/AuthContext';

const PropertiesView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterListingType, setFilterListingType] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProperties();
    // Clients for the linked-client dropdown are fetched lazily when the
    // Add/Edit property modal opens, so we don't fetch them on navigation.
  }, []);
  useEffect(() => {
    if (searchParams.get('openAdd') === '1') {
      handleOpenCreateModal();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openAdd');
      setSearchParams(nextParams, { replace: true });
    }
    
    // Check if we're coming from client card with pre-filled client info
    const state = location.state as { openAdd?: boolean; clientId?: string; clientName?: string } | null;
    if (state?.openAdd && state?.clientId) {
      handleOpenCreateModalWithClient(state.clientId);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [searchParams, location.state]);

  const showTimedSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 3000);
  };

  const resetFormState = () => {
    setFormData(initialFormData);
    setSelectedAmenities([]);
    setValidationErrors({});
    setFormError(null);
    setSelectedProperty(null);
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAllProperties();
      setProperties((response.data || []).map(transformProperty));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      // Lightweight options endpoint (id + name) for the linked-client dropdown.
      const response = await apiClient.getClientOptions();
      setClients(response.data || []);
    } catch (err) {
      console.error('Error fetching clients for property form:', err);
    }
  };

  const fetchPropertyById = async (propertyId: string) => {
    const response = await apiClient.getProperty(propertyId);
    if (!response.data) throw new Error('Property details not found');
    return transformProperty(response.data);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    else if (formData.title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
    else if (formData.title.trim().length > 255) errors.title = 'Title must not exceed 255 characters';
    if (!formData.price) errors.price = 'Price is required';
    else if (parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
    if (!formData.area) errors.area = 'Area is required';
    else if (parseFloat(formData.area) <= 0) errors.area = 'Area must be greater than 0';
    if (formData.type === 'apartment' || formData.type === 'house' || formData.type === 'row_house' || formData.type === 'pg' || formData.type === 'bungalow') {
      if (!formData.bedrooms) errors.bedrooms = 'Bedrooms are required for apartments, houses, row houses, PG, and bungalows';
      else if (parseInt(formData.bedrooms, 10) < 0) errors.bedrooms = 'Bedrooms must be a positive number';
      if (!formData.bathrooms) errors.bathrooms = 'Bathrooms are required for apartments, houses, row houses, PG, and bungalows';
      else if (parseInt(formData.bathrooms, 10) < 0) errors.bathrooms = 'Bathrooms must be a positive number';
    }
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    else if (formData.address.trim().length < 10) errors.address = 'Address must be at least 10 characters';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    else if (formData.description.trim().length < 20) errors.description = 'Description must be at least 20 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildCreatePayload = (): CreatePropertyRequest => {
    const propertyData: CreatePropertyRequest = {
      title: formData.title.trim(), type: formData.type, listing_type: formData.listingType,
      price: parseFloat(formData.price), area: parseFloat(formData.area),
      location: formData.location.trim(), address: formData.address.trim(),
      city: formData.city.trim(), state: formData.state,
      description: formData.description.trim(), amenities: selectedAmenities,
    };
    if (formData.clientId) propertyData.client_id = formData.clientId;
    if (formData.bedrooms) propertyData.bedrooms = parseInt(formData.bedrooms, 10);
    if (formData.bathrooms) propertyData.bathrooms = parseInt(formData.bathrooms, 10);
    return propertyData;
  };

  const buildUpdatePayload = (): UpdatePropertyRequest => {
    const propertyData: UpdatePropertyRequest = {
      title: formData.title.trim(), type: formData.type, listing_type: formData.listingType,
      status: formData.status, price: parseFloat(formData.price), area: parseFloat(formData.area),
      location: formData.location.trim(), address: formData.address.trim(),
      city: formData.city.trim(), state: formData.state,
      description: formData.description.trim(), amenities: selectedAmenities,
    };
    propertyData.client_id = formData.clientId || undefined;
    if (formData.bedrooms) propertyData.bedrooms = parseInt(formData.bedrooms, 10);
    if (formData.bathrooms) propertyData.bathrooms = parseInt(formData.bathrooms, 10);
    return propertyData;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setValidationErrors({});
    if (!validateForm()) { setFormError('Please fix the validation errors before submitting'); return; }
    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const response = await apiClient.createProperty(buildCreatePayload());
        if (response.data) setProperties((prev) => [transformProperty(response.data), ...prev]);
        showTimedSuccessMessage('Property added successfully!');
      } else if (selectedProperty) {
        const response = await apiClient.updateProperty(selectedProperty.id, buildUpdatePayload());
        if (response.data) {
          const updated = transformProperty(response.data);
          setProperties((prev) => prev.map((p) => p.id === updated.id ? updated : p));
          setSelectedProperty(updated);
        }
        showTimedSuccessMessage('Property updated successfully!');
      }
      setShowFormModal(false);
      resetFormState();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      const response = await apiClient.updateProperty(propertyId, { status: newStatus as any });
      if (response.data) {
        const updated = transformProperty(response.data);
        setProperties((prev) => prev.map((p) => p.id === updated.id ? updated : p));
        showTimedSuccessMessage('Property status updated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property status');
      window.setTimeout(() => setError(null), 3000);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) => prev.includes(amenity) ? prev.filter((i) => i !== amenity) : [...prev, amenity]);
  };

  const handleTypeChange = (type: PropertyFormData['type']) => {
    setFormData((prev) => ({
      ...prev, type,
      bedrooms: type === 'commercial' || type === 'plot' || type === 'shop' ? '' : prev.bedrooms,
      bathrooms: type === 'commercial' || type === 'plot' || type === 'shop' ? '' : prev.bathrooms,
    }));
    if (validationErrors.bedrooms || validationErrors.bathrooms)
      setValidationErrors((prev) => ({ ...prev, bedrooms: '', bathrooms: '' }));
  };

  const handleOpenCreateModal = () => {
    fetchClients(); resetFormState(); setFormMode('create'); setShowFormModal(true);
  };

  const handleOpenCreateModalWithClient = async (clientId: string) => {
    await fetchClients();
    resetFormState();
    setFormData((prev) => ({ ...prev, clientId }));
    setFormMode('create');
    setShowFormModal(true);
  };

  const handleViewProperty = async (propertyId: string) => {
    setActionLoadingId(propertyId);
    setError(null);
    try {
      const property = await fetchPropertyById(propertyId);
      setSelectedProperty(property);
      setShowViewModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property details');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditProperty = async (propertyId: string) => {
    setActionLoadingId(propertyId);
    setFormError(null);
    fetchClients();
    try {
      const property = await fetchPropertyById(propertyId);
      setSelectedProperty(property);
      setFormData(propertyToFormData(property));
      setSelectedAmenities(property.amenities || []);
      setValidationErrors({});
      setFormMode('edit');
      setShowFormModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property for editing');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = (property: Property) => {
    setSelectedProperty(property); setShowDeleteModal(true);
  };

  const handleOpenPhotoUpload = () => {
    setShowPhotoUpload(true);
  };

  const handlePhotosUpdated = (photos: string[]) => {
    if (selectedProperty) {
      const updatedProperty = { ...selectedProperty, photos };
      setSelectedProperty(updatedProperty);
      setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
    }
  };

  const handleDeleteProperty = async () => {
    if (!selectedProperty) return;
    setDeleting(true);
    try {
      await apiClient.deleteProperty(selectedProperty.id);
      setProperties((prev) => prev.filter((p) => p.id !== selectedProperty.id));
      setShowDeleteModal(false);
      setShowViewModal(false);
      showTimedSuccessMessage('Property deleted successfully!');
      setSelectedProperty(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete property');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.broker_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesOwner =
      filterOwner === 'all' ||
      (filterOwner === 'mine' && property.broker_id === currentUserId) ||
      (filterOwner === 'others' && property.broker_id !== currentUserId);
    const matchesListingType = filterListingType === 'all' || property.listing_type === filterListingType;
    // Hide sold properties in 'All' and 'Others'' views; brokers can still see their own sold properties in 'Mine'
    const matchesSoldRule = filterOwner === 'mine' || property.status !== 'sold';
    return matchesSearch && matchesStatus && matchesType && matchesOwner && matchesListingType && matchesSoldRule;
  });

  const myCount = properties.filter((p) => p.broker_id === currentUserId).length;
  const othersCount = properties.filter((p) => p.broker_id !== currentUserId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">
            <span className="text-blue-600 font-medium">{myCount} yours</span>
            {' · '}
            <span className="text-gray-500">{othersCount} from other brokers</span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary px-4 py-2 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </button>
          <button onClick={() => window.open(`${API_CONFIG.BASE_URL}/download/properties-sample`)} className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            Download Sample Excel
          </button>
          <input type="file" accept=".xlsx,.xls,.csv" id="propertiesExcelInput" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setSubmitting(true);
              await apiClient.uploadPropertiesExcel(file);
              showTimedSuccessMessage('Properties uploaded successfully');
              fetchProperties();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Upload failed');
            } finally {
              setSubmitting(false);
              (e.target as HTMLInputElement).value = '';
            }
          }} />
          <button onClick={() => document.getElementById('propertiesExcelInput')?.click()} className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            Upload Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title, location, broker or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              {[
                { value: 'all', label: 'All' },
                { value: 'mine', label: 'Mine' },
                { value: 'others', label: "Others'" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterOwner(opt.value)}
                  className={`px-3 py-2 transition-colors ${
                    filterOwner === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <select
              value={filterListingType}
              onChange={(e) => setFilterListingType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Sell / Rent</option>
              <option value="sale">Sell</option>
              <option value="rent">Rent</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="hold">Hold</option>
              <option value="closed">Closed</option>
              <option value="under_discussion">Under Discussion</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot</option>
              <option value="row_house">Row House</option>
              <option value="shop">Shop</option>
              <option value="pg">PG</option>
              <option value="bungalow">Bungalow</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button onClick={fetchProperties} className="mt-1 text-sm text-red-700 underline">Try again</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              currentUserId={currentUserId}
              isBusy={actionLoadingId === property.id}
              onView={handleViewProperty}
              onEdit={handleEditProperty}
              onDelete={handleDeleteClick}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {!loading && filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterOwner !== 'all'
              ? 'Try adjusting your filters.'
              : 'Get started by adding your first property.'}
          </p>
          <button onClick={handleOpenCreateModal} className="inline-flex items-center btn-primary px-4 py-2">
            <Plus className="h-5 w-5 mr-2" />Add Property
          </button>
        </div>
      )}

      {showFormModal && (
        <PropertyFormModal
          formMode={formMode} formData={formData} validationErrors={validationErrors}
          formError={formError} submitting={submitting} clients={clients}
          selectedAmenities={selectedAmenities} currentPhotos={selectedProperty?.photos || []}
          handleInputChange={handleInputChange}
          handleTypeChange={handleTypeChange} setFormData={setFormData}
          handleAmenityToggle={handleAmenityToggle} handleFormSubmit={handleFormSubmit}
          onOpenPhotoUpload={formMode === 'edit' ? handleOpenPhotoUpload : undefined}
          onClose={() => { setShowFormModal(false); resetFormState(); }}
        />
      )}

      {showViewModal && selectedProperty && (
        <PropertyViewModal
          property={selectedProperty}
          currentUserId={currentUserId}
          onClose={() => setShowViewModal(false)}
          onEdit={handleEditProperty}
          onDelete={handleDeleteClick}
          onManagePhotos={selectedProperty.broker_id === currentUserId ? handleOpenPhotoUpload : undefined}
        />
      )}

      {showDeleteModal && selectedProperty && (
        <PropertyDeleteModal
          property={selectedProperty} deleting={deleting} formError={formError}
          onClose={() => { setShowDeleteModal(false); setFormError(null); }}
          onConfirm={handleDeleteProperty}
        />
      )}

      {showPhotoUpload && selectedProperty && (
        <PropertyPhotoUpload
          propertyId={selectedProperty.id}
          currentPhotos={selectedProperty.photos || []}
          onPhotosUpdated={handlePhotosUpdated}
          onClose={() => setShowPhotoUpload(false)}
        />
      )}

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default PropertiesView;
