import React, { useState } from 'react';
import { Plus, Search, Users, Briefcase, UserCheck, UserX } from 'lucide-react';
import StaffForm, { StaffFormData } from './StaffForm';
import StaffCard from './StaffCard';

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string;
  experience_years: number;
  status: 'available' | 'employed' | 'inactive';
  type: 'available' | 'required';
  location: string;
  address: string;
  description: string;
  resume_url?: string;
  photo_url?: string;
  created_at: string;
}

const emptyForm: StaffFormData = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  role: '',
  experience_years: '',
  status: 'available',
  type: 'available',
  location: '',
  address: '',
  description: '',
  resume: null,
  photo: null,
};

const StaffView: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([
    {
      id: '1',
      first_name: 'Ravi',
      last_name: 'Sharma',
      phone: '+91 98765 43210',
      email: 'ravi@example.com',
      role: 'Real Estate Agent',
      experience_years: 5,
      status: 'available',
      type: 'available',
      location: 'Koramangala, Bangalore',
      address: '12, 5th Cross, Koramangala',
      description: 'Experienced real estate agent specializing in residential properties. Strong negotiation skills and client management.',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      first_name: 'Priya',
      last_name: 'Mehta',
      phone: '+91 98765 43211',
      email: 'priya@example.com',
      role: 'Property Manager',
      experience_years: 3,
      status: 'available',
      type: 'available',
      location: 'Andheri, Mumbai',
      address: 'Andheri West, Mumbai',
      description: 'Property management professional with expertise in tenant relations and maintenance coordination.',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      first_name: 'Sales Executive',
      last_name: '(Required)',
      phone: '',
      email: '',
      role: 'Sales Executive',
      experience_years: 2,
      status: 'available',
      type: 'required',
      location: 'Pune, Maharashtra',
      address: '',
      description: 'Looking for a motivated sales executive with minimum 2 years experience in real estate. Must have own vehicle.',
      created_at: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'required'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(null), 4000);
  };

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (member: StaffMember) => {
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone,
      email: member.email,
      role: member.role,
      experience_years: String(member.experience_years),
      status: member.status,
      type: member.type,
      location: member.location,
      address: member.address,
      description: member.description,
      resume: null,
      photo: null,
    });
    setEditingId(member.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim()) { setFormError('First name is required'); return; }
    if (!formData.role.trim()) { setFormError('Role/Position is required'); return; }
    if (!formData.location.trim()) { setFormError('Location is required'); return; }
    if (formData.type === 'available' && !formData.phone.trim()) {
      setFormError('Phone number is required for available staff');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise((r) => window.setTimeout(r, 600));

      const newMember: StaffMember = {
        id: editingId || String(Date.now()),
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        experience_years: Number(formData.experience_years) || 0,
        status: formData.status,
        type: formData.type,
        location: formData.location,
        address: formData.address,
        description: formData.description,
        resume_url: formData.resume ? URL.createObjectURL(formData.resume) : undefined,
        photo_url: formData.photo ? URL.createObjectURL(formData.photo) : undefined,
        created_at: new Date().toISOString(),
      };

      if (editingId) {
        setStaffList((prev) => prev.map((m) => (m.id === editingId ? newMember : m)));
        showSuccess('Staff member updated successfully!');
      } else {
        setStaffList((prev) => [newMember, ...prev]);
        showSuccess('Staff member added successfully!');
      }
      setShowForm(false);
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this staff member?')) return;
    setStaffList((prev) => prev.filter((m) => m.id !== id));
    showSuccess('Staff member removed.');
  };

  const filtered = staffList.filter((m) => {
    const name = `${m.first_name} ${m.last_name}`.toLowerCase();
    const matchSearch =
      name.includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || m.type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total: staffList.length,
    available: staffList.filter((m) => m.type === 'available').length,
    required: staffList.filter((m) => m.type === 'required').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage available staff and recruitment requirements</p>
        </div>
        <button
          onClick={openAddForm}
          className="mt-4 sm:mt-0 btn-primary px-4 py-2 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <div className="text-sm text-gray-600 font-medium">Total</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.available}</span>
          </div>
          <div className="text-sm text-gray-600 font-medium">Available</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.required}</span>
          </div>
          <div className="text-sm text-gray-600 font-medium">Required</div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="available">Available Staff</option>
            <option value="required">Required / Recruitment</option>
          </select>
        </div>
      </div>

      {/* Staff cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first staff member or recruitment requirement'}
          </p>
          <button
            onClick={openAddForm}
            className="btn-primary px-6 py-2"
          >
            Add Staff
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <StaffForm
          formData={formData}
          editingId={editingId}
          submitting={submitting}
          formError={formError}
          onInputChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onFileChange={(field, file) => setFormData((prev) => ({ ...prev, [field]: file }))}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Success toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <UserCheck className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default StaffView;
