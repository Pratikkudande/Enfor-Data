import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Building2, CheckCircle, XCircle, Upload, Loader2, Eye, Edit2, Trash2 } from 'lucide-react';
import { buildingApi, BuildingContact } from '../../services/buildingApi';
import { API_CONFIG } from '../../config/api';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import BuildingForm, { BuildingFormData } from './BuildingForm';

const emptyForm: BuildingFormData = {
  ownerName: '',
  mobileNumber: '',
  buildingName: '',
  area: '',
  notes: '',
};

const BuildingDataView: React.FC = () => {
  const [contacts, setContacts] = useState<BuildingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BuildingFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    window.setTimeout(() => setErrorMessage(null), 6000);
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await buildingApi.getContacts();
      setContacts(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch building contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsViewMode(false);
    setFormError(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };
  const closeModal = () => { setShowModal(false); resetForm(); };

  const openEditModal = (contact: BuildingContact) => {
    setIsViewMode(false);
    setEditingId(contact.id);
    setFormData({
      ownerName: contact.owner_name ?? '',
      mobileNumber: contact.mobile_number,
      buildingName: contact.building_name ?? '',
      area: contact.area ?? '',
      notes: contact.notes ?? '',
    });
    setShowModal(true);
  };

  const openViewModal = (contact: BuildingContact) => {
    openEditModal(contact);
    setIsViewMode(true);
  };

  const uniqueAreas = Array.from(new Set(contacts.map(c => c.area).filter(Boolean))) as string[];
  const uniqueBuildings = Array.from(new Set(contacts.map(c => c.building_name).filter(Boolean))) as string[];

  const filteredContacts = contacts.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (c.owner_name?.toLowerCase().includes(term) ?? false) ||
      c.mobile_number.toLowerCase().includes(term) ||
      (c.building_name?.toLowerCase().includes(term) ?? false) ||
      (c.area?.toLowerCase().includes(term) ?? false);
    const matchesArea = !filterArea || (c.area?.toLowerCase().includes(filterArea.toLowerCase()) ?? false);
    const matchesBuilding = !filterBuilding || (c.building_name?.toLowerCase().includes(filterBuilding.toLowerCase()) ?? false);
    return matchesSearch && matchesArea && matchesBuilding;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.mobileNumber.trim()) {
      setFormError('Mobile number is required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        mobile_number: formData.mobileNumber.trim(),
        owner_name: formData.ownerName.trim() || undefined,
        building_name: formData.buildingName.trim() || undefined,
        area: formData.area.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };
      if (editingId) {
        const res = await buildingApi.updateContact(editingId, payload);
        setContacts(prev => prev.map(c => c.id === editingId ? res.data : c));
        showSuccess('Building contact updated successfully!');
      } else {
        const res = await buildingApi.createContact(payload);
        setContacts(prev => [res.data, ...prev]);
        showSuccess('Building contact added successfully!');
      }
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save contact';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contact: BuildingContact) => {
    const name = contact.building_name || contact.owner_name || contact.mobile_number;
    if (!window.confirm(`Delete building contact "${name}"?`)) return;
    try {
      setDeletingId(contact.id);
      await buildingApi.deleteContact(contact.id);
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      showSuccess('Building contact deleted successfully!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete contact');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Building Data</h1>
          <p className="text-gray-600 mt-1">Store building owner contacts for marketing and lead generation</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={openAddModal}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Contact
          </button>
          <button onClick={() => window.open(`${API_CONFIG.BASE_URL}/download/building-contacts-sample`)} className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm">
            Download Sample Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            id="buildingContactsExcelInput"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadFileName(file.name);
              setUploading(true);
              try {
                const response = await buildingApi.uploadExcel(file);
                const data = (response as any)?.data;
                const created = data?.created ?? 0;
                const duplicates = data?.duplicates ?? 0;
                const errors = data?.errors ?? [];
                let msg = `${created} building contact${created !== 1 ? 's' : ''} imported successfully`;
                if (duplicates > 0) msg += ` · ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped`;
                if (errors.length > 0) msg += ` · ${errors.length} row${errors.length !== 1 ? 's' : ''} failed`;
                showSuccess(msg);
                fetchContacts();
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by owner, mobile, building, or area…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">All Areas</option>
              {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={filterBuilding}
              onChange={e => setFilterBuilding(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">All Buildings</option>
              {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        <span>
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
          {(searchTerm || filterArea || filterBuilding) ? ' matching filters' : ' total'}
        </span>
      </div>

      {loading && <LoadingState message="Loading building contacts…" />}
      {error && !loading && <ErrorState message={error} onRetry={fetchContacts} />}

      {!loading && !error && (
        filteredContacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No building contacts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterArea || filterBuilding
                ? 'Try adjusting your search or filters'
                : 'Start building your database by adding the first contact'}
            </p>
            {!searchTerm && !filterArea && !filterBuilding && (
              <button
                onClick={openAddModal}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add Contact
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Building</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-gray-900">
                            {contact.building_name || <span className="text-gray-400 italic">No Building Name</span>}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">ID: {contact.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{contact.owner_name || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{contact.mobile_number}</td>
                    <td className="px-4 py-3 text-gray-700">{contact.area || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{contact.notes || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(contact.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(contact)}
                          className="bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(contact)}
                          className="bg-gray-50 text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact)}
                          disabled={deletingId === contact.id}
                          className="bg-red-50 text-red-700 p-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showModal && (
        <BuildingForm
          formData={formData}
          editingId={editingId}
          isViewOnly={isViewMode}
          submitting={submitting}
          formError={formError}
          onInputChange={e => {
            const phoneFields = ['mobileNumber'];
            const value = phoneFields.includes(e.target.name) ? e.target.value.replace(/\D/g, '') : e.target.value;
            setFormData({ ...formData, [e.target.name]: value });
          }}
          onSubmit={handleSubmit}
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
    </div>
  );
};

export default BuildingDataView;
