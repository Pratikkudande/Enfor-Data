import React, { useState, useEffect } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { apiClient, Client as ApiClient, CreateClientRequest } from '../../services/api';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import ClientCard from './ClientCard';
import ClientForm from './ClientForm';

const ClientsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClientType, setSelectedClientType] = useState<'buyer' | 'seller' | 'tenant'>('buyer');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientType, setEditingClientType] = useState<ApiClient['type'] | null>(null);

  const [realClients, setRealClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

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

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', location: '', contactNo: '', email: '',
    address: '', city: '', state: '', postalCode: '', enquiry: '',
    budgetMin: '', budgetMax: ''
  });

  const resetFormState = () => {
    setFormData({
      firstName: '', lastName: '', location: '', contactNo: '', email: '',
      address: '', city: '', state: '', postalCode: '', enquiry: '',
      budgetMin: '', budgetMax: ''
    });
    setSelectedClientType('buyer');
    setEditingClientId(null);
    setEditingClientType(null);
  };

  const openAddModal = () => { resetFormState(); setShowAddModal(true); };
  const closeModal = () => { setShowAddModal(false); resetFormState(); };

  const openEditModal = (client: ApiClient) => {
    setEditingClientId(client.id);
    setEditingClientType(client.type);
    setSelectedClientType(client.type === 'seller' || client.type === 'tenant' ? client.type : 'buyer');

    setFormData({
      firstName: client.first_name, lastName: client.last_name,
      location: client.preferred_location, contactNo: client.phone,
      email: client.email, address: client.address, city: client.city,
      state: client.state, postalCode: client.postal_code,
      enquiry: client.requirements,
      budgetMin: client.budget_min ? client.budget_min.toString() : '',
      budgetMax: client.budget_max ? client.budget_max.toString() : '',
    });
    setShowAddModal(true);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'tenant': return 'bg-orange-100 text-orange-800';
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
    if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`;
    return min ? `From ${formatAmount(min)}` : `Up to ${formatAmount(max!)}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const clientData: CreateClientRequest = {
        first_name: formData.firstName, last_name: formData.lastName,
        email: formData.email, phone: formData.contactNo,
        type: editingClientType === 'owner' ? 'owner' : selectedClientType,
        preferred_location: formData.location, address: formData.address,
        city: formData.city, state: formData.state,
        postal_code: formData.postalCode, requirements: formData.enquiry,
      };

      if (formData.budgetMin.trim()) {
        const min = parseFloat(formData.budgetMin);
        if (isNaN(min) || min <= 0) { alert('❌ Error: Min Budget must be valid > 0'); return; }
        clientData.budget_min = min;
      }
      if (formData.budgetMax.trim()) {
        const max = parseFloat(formData.budgetMax);
        if (isNaN(max) || max <= 0) { alert('❌ Error: Max Budget must be valid > 0'); return; }
        clientData.budget_max = max;
      }
      if (clientData.budget_min && clientData.budget_max && clientData.budget_min > clientData.budget_max) {
        alert('❌ Error: Min Budget cannot be greater than Max Budget'); return;
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
        alert(editingClientId ? '✅ Client updated successfully!' : '✅ Client added successfully!');
        closeModal();
      }
    } catch (err) {
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
      alert('✅ Client marked as inactive successfully!');
    } catch (err) {
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
        <button onClick={openAddModal} className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-5 w-5 mr-2" /> Add Client
        </button>
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
              <option value="seller">Sale</option>
              <option value="tenant">Rent</option>
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
              getStatusColor={getStatusColor}
              formatBudget={formatBudget}
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
              <button onClick={openAddModal} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Add Client</button>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <ClientForm
          formData={formData}
          selectedClientType={selectedClientType}
          editingClientId={editingClientId}
          submitting={submitting}
          onInputChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
          onTypeChange={setSelectedClientType}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
        />
      )}
    </div>
  );
};

export default ClientsView;