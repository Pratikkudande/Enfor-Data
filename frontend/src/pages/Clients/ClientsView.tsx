import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, User, Upload, Loader2, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { apiClient, Client as ApiClient, CreateClientRequest } from '../../services/api';
import { API_CONFIG } from '../../config/api';
import { useSearchParams } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ClientCard from './ClientCard';
import ClientForm from './ClientForm';

const ClientsView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedClientType, setSelectedClientType] = useState<'buyer' | 'seller' | 'tenant' | 'list_property_for_rent'>('buyer');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientType, setEditingClientType] = useState<ApiClient['type'] | null>(null);

  const [realClients, setRealClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isExpectedAmountType = (type: string) => type !== 'buyer' && type !== 'tenant';

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    window.setTimeout(() => setErrorMessage(null), 6000);
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getClients();
      if (response.data) setRealClients(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => {
    if (searchParams.get('openAdd') === '1') {
      openAddModal();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openAdd');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', location: '', contactNo: '', email: '',
    address: '', city: '', state: '', postalCode: '', enquiry: '',
    budgetMin: '', budgetMax: '', expectedAmount: '',
    minPrice: '', maxPrice: '', propertyAddress: '',
    buildupArea: '', carpetArea: '', measurementUnit: '',
    depositBudget: '',
  });

  const resetFormState = () => {
    setFormData({
      firstName: '', lastName: '', location: '', contactNo: '', email: '',
      address: '', city: '', state: '', postalCode: '', enquiry: '',
      budgetMin: '', budgetMax: '', expectedAmount: '',
      minPrice: '', maxPrice: '', propertyAddress: '',
      buildupArea: '', carpetArea: '', measurementUnit: '',
      depositBudget: '',
    });
    setSelectedClientType('buyer');
    setEditingClientId(null);
    setEditingClientType(null);
    setIsViewMode(false);
  };

  const openAddModal = () => { resetFormState(); setIsViewMode(false); setShowAddModal(true); };
  const closeModal = () => { setShowAddModal(false); resetFormState(); };

  const openEditModal = (client: ApiClient) => {
    setIsViewMode(false);
    setEditingClientId(client.id);
    setEditingClientType(client.type);
    setSelectedClientType(
      client.type === 'seller' || client.type === 'tenant' || client.type === 'list_property_for_rent'
        ? client.type
        : client.type === 'owner'
          ? 'seller'
        : 'buyer'
    );

    setFormData({
      firstName: client.first_name, lastName: client.last_name,
      location: client.preferred_location, contactNo: client.phone,
      email: client.email, address: client.address ?? '', city: client.city ?? '',
      state: client.state ?? '', postalCode: client.postal_code ?? '',
      enquiry: client.requirements,
      budgetMin: client.budget_min ? client.budget_min.toString() : '',
      budgetMax: client.budget_max ? client.budget_max.toString() : '',
      expectedAmount: client.expected_amount ? client.expected_amount.toString() : '',
      minPrice: (client as any).min_price ? (client as any).min_price.toString() : '',
      maxPrice: (client as any).max_price ? (client as any).max_price.toString() : '',
      propertyAddress: (client as any).property_address ?? '',
      buildupArea: (client as any).buildup_area ? (client as any).buildup_area.toString() : '',
      carpetArea: (client as any).carpet_area ? (client as any).carpet_area.toString() : '',
      measurementUnit: (client as any).measurement_unit ?? '',
      depositBudget: (client as any).deposit_budget ? (client as any).deposit_budget.toString() : '',
    });
    setShowAddModal(true);
  };

  const openViewModal = (client: ApiClient) => {
    openEditModal(client);
    setIsViewMode(true);
  };

  const filteredClients = realClients
    .map(client => ({ ...client, name: `${client.first_name} ${client.last_name}` }))
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.preferred_location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || client.type === filterType;
      return matchesSearch && matchesType;
    });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'buyer': return 'Buy';
      case 'seller': return 'Sell';
      case 'tenant': return 'Rent';
      case 'list_property_for_rent': return 'Property Owner';
      case 'owner': return 'Owner';
      default: return type.replace(/_/g, ' ');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'tenant': return 'bg-orange-100 text-orange-800';
      case 'list_property_for_rent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Budget not specified';
    const formatAmount = (amount: number) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
      return `₹${amount.toLocaleString()}`;
    };
    if (min && max) {
      if (min === max) return formatAmount(min);
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return min ? `From ${formatAmount(min)}` : `Up to ${formatAmount(max!)}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      const clientData: CreateClientRequest = {
        first_name: formData.firstName, last_name: formData.lastName,
        email: formData.email.trim() || undefined,
        phone: formData.contactNo,
        type: editingClientType === 'owner' ? 'owner' : selectedClientType,
        preferred_location: formData.location,
        address: formData.address,
        city: formData.city, state: formData.state,
        postal_code: formData.postalCode, requirements: formData.enquiry,
      };

      if (isExpectedAmountType(selectedClientType)) {
        if (!formData.expectedAmount.trim()) {
          setFormError('Expected Amount is required for this client type');
          return;
        }
        const amount = parseFloat(formData.expectedAmount);
        if (isNaN(amount) || amount <= 0) {
          setFormError('Expected Amount must be a valid number greater than 0');
          return;
        }
        clientData.expected_amount = amount;
      } else {
        if (formData.budgetMin.trim()) {
          const min = parseFloat(formData.budgetMin);
          if (isNaN(min) || min <= 0) { setFormError('Min Budget must be a valid number greater than 0'); return; }
          clientData.budget_min = min;
        }
        if (formData.budgetMax.trim()) {
          const max = parseFloat(formData.budgetMax);
          if (isNaN(max) || max <= 0) { setFormError('Max Budget must be a valid number greater than 0'); return; }
          clientData.budget_max = max;
        }
        if (clientData.budget_min && clientData.budget_max && clientData.budget_min > clientData.budget_max) {
          setFormError('Min Budget cannot be greater than Max Budget');
          return;
        }
      }

      // Sell Property fields
      if (selectedClientType === 'seller') {
        if (formData.minPrice.trim()) clientData.min_price = parseFloat(formData.minPrice);
        if (formData.maxPrice.trim()) clientData.max_price = parseFloat(formData.maxPrice);
        if (formData.propertyAddress.trim()) clientData.property_address = formData.propertyAddress.trim();
      }

      // Area fields
      if (formData.buildupArea.trim()) clientData.buildup_area = parseFloat(formData.buildupArea);
      if (formData.carpetArea.trim()) clientData.carpet_area = parseFloat(formData.carpetArea);
      if (formData.measurementUnit.trim()) clientData.measurement_unit = formData.measurementUnit;

      // Deposit budget for tenant OR property-for-rent owner
      if ((selectedClientType === 'tenant' || selectedClientType === 'list_property_for_rent') && formData.depositBudget.trim()) {
        clientData.deposit_budget = parseFloat(formData.depositBudget);
      }

      const response = editingClientId
        ? await apiClient.updateClient(editingClientId, clientData)
        : await apiClient.createClient(clientData);

      if (response.data) {
        if (editingClientId) {
          setRealClients(prev => prev.map(c => c.id === response.data!.id ? response.data! : c));
        } else {
          setRealClients(prev => [response.data!, ...prev]);
        }
        showSuccess(editingClientId ? 'Client updated successfully!' : 'Client added successfully!');
        closeModal();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save client';
      setFormError(msg);
      console.error('Error saving client:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: ApiClient) => {
    const confirmed = window.confirm(`Mark client ${client.first_name} ${client.last_name} as inactive?`);
    if (!confirmed) return;
    try {
      setDeletingClientId(client.id);
      const response = await apiClient.updateClient(client.id, { status: 'inactive' });
      setRealClients(prev => prev.map(item => item.id === client.id ? (response.data || { ...item, status: 'inactive' }) : item));
      showSuccess('Client marked as inactive successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update client';
      setError(msg);
      console.error('Error marking client inactive:', err);
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button onClick={openAddModal} className="btn-primary px-4 py-2 flex items-center">
            <Plus className="h-5 w-5 mr-2" /> Add Client
          </button>
          <button onClick={() => window.open(`${API_CONFIG.BASE_URL}/download/clients-sample`)} className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm">
            Download Sample Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            id="clientsExcelInput"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadFileName(file.name);
              setUploading(true);
              try {
                const response = await apiClient.uploadClientsExcel(file);
                const data = (response as any)?.data;
                const created = data?.created ?? 0;
                const duplicates = data?.duplicates ?? 0;
                const errors = data?.errors ?? [];
                let msg = `${created} client${created !== 1 ? 's' : ''} imported successfully`;
                if (duplicates > 0) msg += ` · ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped`;
                if (errors.length > 0) msg += ` · ${errors.length} row${errors.length !== 1 ? 's' : ''} failed`;
                showSuccess(msg);
                fetchClients();
              } catch (err) {
                showError(err instanceof Error ? err.message : 'Upload failed. Please check your file and try again.');
              } finally {
                setUploading(false);
                setUploadFileName('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? 'Uploading…' : 'Upload Excel'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text" placeholder="Search clients by name, email, or location..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Types</option>
              <option value="buyer">Buy</option>
              <option value="seller">Sell</option>
              <option value="tenant">Rent</option>
              <option value="list_property_for_rent">Property Owner</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Loading clients..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchClients} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
              getStatusColor={getStatusColor}
              formatBudget={formatBudget}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={handleDeleteClient}
              isDeleting={deletingClientId === client.id}
            />
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">{searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first client'}</p>
              <button onClick={openAddModal} className="btn-primary px-6 py-2">Add Client</button>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <ClientForm
          formData={formData}
          selectedClientType={selectedClientType}
          editingClientId={editingClientId}
          isViewOnly={isViewMode}
          submitting={submitting}
          formError={formError}
          onInputChange={(e) => {
            const phoneFields = ['contactNo'];
            const value = phoneFields.includes(e.target.name) ? e.target.value.replace(/\D/g, '') : e.target.value;
            setFormData({ ...formData, [e.target.name]: value });
          }}
          onTypeChange={setSelectedClientType}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
        />
      )}

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 max-w-sm">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 max-w-sm">
          <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
            <div className="relative">
              <FileSpreadsheet className="h-12 w-12 text-green-500" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-semibold text-base">Importing clients…</p>
              {uploadFileName && (
                <p className="text-gray-500 text-sm mt-1 truncate max-w-[220px]">{uploadFileName}</p>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-gray-400 text-xs">Please wait, do not close this page</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;