import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Eye, Upload, UserX, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { externalBrokerApi, ExternalBroker, CreateExternalBrokerRequest } from '../../services/externalBrokerApi';
import { ExternalBrokerModal } from '../Network/components';
import ExternalBrokerUploadModal from './Components/ExternalBrokerUploadModal';

const ExternalBrokerManagement: React.FC = () => {
  const [brokers, setBrokers] = useState<ExternalBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emptyForm: CreateExternalBrokerRequest = { name: '', mobile_number: '', area: '', location: '', notes: '' };
  const [formData, setFormData] = useState<CreateExternalBrokerRequest>(emptyForm);
  const [originalForm, setOriginalForm] = useState<CreateExternalBrokerRequest | null>(null);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);

  const showSuccess = (msg: string) => { setSuccess(msg); window.setTimeout(() => setSuccess(null), 4000); };
  const showError = (msg: string) => { setError(msg); window.setTimeout(() => setError(null), 5000); };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await externalBrokerApi.getAll();
      setBrokers(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const filtered = brokers.filter(b => {
    const t = search.toLowerCase();
    return b.name.toLowerCase().includes(t) ||
      b.mobile_number.includes(t) ||
      (b.area?.toLowerCase().includes(t) ?? false) ||
      (b.location?.toLowerCase().includes(t) ?? false);
  });

  // Modal helpers
  const openAdd = () => { setFormData(emptyForm); setEditingId(null); setViewOnly(false); setFormError(null); setShowModal(true); };
  const openView = (b: ExternalBroker) => {
    const v = { name: b.name, mobile_number: b.mobile_number, area: b.area ?? '', location: b.location ?? '', notes: b.notes ?? '' };
    setFormData(v); setOriginalForm(v); setEditingId(b.id); setViewOnly(true); setFormError(null); setShowModal(true);
  };
  const openEdit = (b: ExternalBroker) => {
    const v = { name: b.name, mobile_number: b.mobile_number, area: b.area ?? '', location: b.location ?? '', notes: b.notes ?? '' };
    setFormData(v); setOriginalForm(v); setEditingId(b.id); setViewOnly(false); setFormError(null); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setFormData(emptyForm); setEditingId(null); setFormError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.mobile_number.trim()) { setFormError('Mobile number is required'); return; }
    if (!formData.name.trim()) { setFormError('Name is required'); return; }
    setSubmitting(true);
    try {
      const payload: CreateExternalBrokerRequest = {
        name: formData.name.trim(),
        mobile_number: formData.mobile_number.trim(),
        area: formData.area?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };
      if (editingId) {
        const res = await externalBrokerApi.update(editingId, payload);
        setBrokers(prev => prev.map(b => b.id === editingId ? res.data : b));
        showSuccess('Broker updated successfully!');
        setViewOnly(true);
        setOriginalForm(payload);
      } else {
        const res = await externalBrokerApi.create(payload);
        setBrokers(prev => [res.data, ...prev]);
        showSuccess('Broker added successfully!');
        closeModal();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSubmitting(false); }
  };

  const handleAdminDelete = async (b: ExternalBroker) => {
    if (!window.confirm(`Delete external broker "${b.name}"? This cannot be undone.`)) return;
    setDeletingId(b.id);
    try {
      await externalBrokerApi.adminDelete(b.id);
      setBrokers(prev => prev.filter(x => x.id !== b.id));
      showSuccess('Broker deleted successfully!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete');
    } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserX className="w-7 h-7 text-indigo-600" />
            External Broker Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage non-EnforData brokers across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Upload className="h-4 w-4" /> Bulk Upload
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Broker
          </button>
        </div>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total External Brokers</p>
          <p className="text-3xl font-bold text-indigo-700 mt-1">{brokers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Search Results</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">With Location Info</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{brokers.filter(b => b.location).length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, area or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No external brokers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Try adjusting your search' : 'Add your first external broker'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Mobile</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 hidden sm:table-cell">Area</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Location</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Added By</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserX className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.name}</p>
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Not on EnforData</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{b.mobile_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{b.area ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{b.location ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">{b.added_by_name ?? 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openView(b)} className="text-blue-600 hover:text-blue-700 p-1" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(b)} className="text-gray-600 hover:text-gray-800 p-1" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAdminDelete(b)}
                          disabled={deletingId === b.id}
                          className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
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
        )}
      </div>

      {/* Success/Error toasts */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <CheckCircle className="h-5 w-5 mr-2" /> {success}
        </div>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <XCircle className="h-5 w-5 mr-2" /> {error}
        </div>
      )}

      {/* Add/Edit/View Modal */}
      <ExternalBrokerModal
        isOpen={showModal}
        isViewOnly={viewOnly}
        isEditing={!!editingId}
        formData={formData}
        error={formError}
        submitting={submitting}
        onClose={closeModal}
        onFormChange={data => setFormData(prev => ({ ...prev, ...data }))}
        onSubmit={handleSubmit}
        onEditToggle={() => setViewOnly(false)}
        onCancelEdit={() => { if (originalForm) setFormData(originalForm); setViewOnly(true); }}
      />

      {/* Upload Modal */}
      <ExternalBrokerUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={(created) => {
          showSuccess(`${created} broker${created !== 1 ? 's' : ''} added successfully!`);
          load();
        }}
      />
    </div>
  );
};

export default ExternalBrokerManagement;
