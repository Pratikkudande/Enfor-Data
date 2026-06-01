import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../types';
import { apiClient } from '../../services/api';
import { indianStates } from '../../constants/options';
import { projectAmenities } from './utils';

interface Props {
  mode: 'create' | 'edit';
  project: Project | null;
  onClose: () => void;
  onCreate: (project: Project) => void;
  onUpdate: (project: Project) => void;
}

interface FormState {
  name: string;
  builder_name: string;
  project_type: 'residential' | 'commercial' | 'mixed';
  description: string;
  location: string;
  address: string;
  city: string;
  state: string;
  total_units: string;
  available_units: string;
  price_range_min: string;
  price_range_max: string;
  launch_date: string;
  possession_date: string;
  status: 'upcoming' | 'launched' | 'under_construction' | 'ready' | 'sold_out';
  brochure_url: string;
}

const empty: FormState = {
  name: '', builder_name: '', project_type: 'residential', description: '',
  location: '', address: '', city: '', state: '',
  total_units: '', available_units: '',
  price_range_min: '', price_range_max: '',
  launch_date: '', possession_date: '',
  status: 'upcoming', brochure_url: '',
};

const ProjectFormModal: React.FC<Props> = ({ mode, project, onClose, onCreate, onUpdate }) => {
  const [form, setForm] = useState<FormState>(empty);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setForm({
        name: project.name,
        builder_name: project.builder_name,
        project_type: project.project_type,
        description: project.description,
        location: project.location,
        address: project.address,
        city: project.city,
        state: project.state,
        total_units: String(project.total_units),
        available_units: String(project.available_units),
        price_range_min: String(project.price_range_min),
        price_range_max: String(project.price_range_max),
        launch_date: project.launch_date.split('T')[0],
        possession_date: project.possession_date.split('T')[0],
        status: project.status,
        brochure_url: project.brochure_url ?? '',
      });
      setAmenities(project.amenities || []);
    } else {
      setForm(empty);
      setAmenities([]);
    }
  }, [mode, project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError(null);
  };

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.builder_name.trim()) e.builder_name = 'Builder name is required';
    if (!form.description.trim() || form.description.trim().length < 20) e.description = 'Description must be at least 20 characters';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (!form.total_units || parseInt(form.total_units) <= 0) e.total_units = 'Total units must be > 0';
    if (form.available_units === '' || parseInt(form.available_units) < 0) e.available_units = 'Available units must be ≥ 0';
    if (parseInt(form.available_units) > parseInt(form.total_units)) e.available_units = 'Cannot exceed total units';
    if (!form.price_range_min || parseFloat(form.price_range_min) <= 0) e.price_range_min = 'Min price must be > 0';
    if (!form.price_range_max || parseFloat(form.price_range_max) <= 0) e.price_range_max = 'Max price must be > 0';
    if (parseFloat(form.price_range_max) < parseFloat(form.price_range_min)) e.price_range_max = 'Max must be ≥ min price';
    if (!form.launch_date) e.launch_date = 'Launch date is required';
    if (!form.possession_date) e.possession_date = 'Possession date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: CreateProjectRequest = {
          name: form.name.trim(),
          builder_name: form.builder_name.trim(),
          project_type: form.project_type,
          description: form.description.trim(),
          location: form.location.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state,
          total_units: parseInt(form.total_units),
          available_units: parseInt(form.available_units),
          price_range_min: parseFloat(form.price_range_min),
          price_range_max: parseFloat(form.price_range_max),
          amenities,
          launch_date: form.launch_date,
          possession_date: form.possession_date,
          status: form.status,
          brochure_url: form.brochure_url.trim() || undefined,
        };
        const res = await apiClient.createProject(payload);
        if (res.data) onCreate(res.data);
      } else if (project) {
        const payload: UpdateProjectRequest = {
          name: form.name.trim(),
          builder_name: form.builder_name.trim(),
          project_type: form.project_type,
          description: form.description.trim(),
          location: form.location.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state,
          total_units: parseInt(form.total_units),
          available_units: parseInt(form.available_units),
          price_range_min: parseFloat(form.price_range_min),
          price_range_max: parseFloat(form.price_range_max),
          amenities,
          launch_date: form.launch_date,
          possession_date: form.possession_date,
          status: form.status,
          brochure_url: form.brochure_url.trim() || undefined,
        };
        const res = await apiClient.updateProject(project.id, payload);
        if (res.data) onUpdate(res.data);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label: string, name: keyof FormState, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Project' : 'Edit Project'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === 'create' ? 'List a new real estate project.' : 'Update project details.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {formError}
            </div>
          )}

          {/* Section 1 — Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('Project Name', 'name', true)}
              {field('Builder Name', 'builder_name', true)}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {(['residential', 'commercial', 'mixed'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, project_type: t }))}
                    className={`py-2.5 border-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      form.project_type === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the project, highlights, and unique features… (min 20 chars)"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
            </div>
          </div>

          {/* Section 2 — Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('Location / Area', 'location', true)}
              {field('City', 'city', true)}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.address ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.state ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Select state…</option>
                {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
            </div>
          </div>

          {/* Section 3 — Units & Pricing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Units & Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Units <span className="text-red-500">*</span></label>
                <input type="number" name="total_units" value={form.total_units} onChange={handleChange} min="1"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.total_units ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.total_units && <p className="mt-1 text-xs text-red-600">{errors.total_units}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Units <span className="text-red-500">*</span></label>
                <input type="number" name="available_units" value={form.available_units} onChange={handleChange} min="0"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.available_units ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.available_units && <p className="mt-1 text-xs text-red-600">{errors.available_units}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" name="price_range_min" value={form.price_range_min} onChange={handleChange} min="1"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.price_range_min ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.price_range_min && <p className="mt-1 text-xs text-red-600">{errors.price_range_min}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" name="price_range_max" value={form.price_range_max} onChange={handleChange} min="1"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.price_range_max ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.price_range_max && <p className="mt-1 text-xs text-red-600">{errors.price_range_max}</p>}
              </div>
            </div>
          </div>

          {/* Section 4 — Timeline & Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline & Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Launch Date <span className="text-red-500">*</span></label>
                <input type="date" name="launch_date" value={form.launch_date} onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.launch_date ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.launch_date && <p className="mt-1 text-xs text-red-600">{errors.launch_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Possession Date <span className="text-red-500">*</span></label>
                <input type="date" name="possession_date" value={form.possession_date} onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.possession_date ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.possession_date && <p className="mt-1 text-xs text-red-600">{errors.possession_date}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['upcoming', 'launched', 'under_construction', 'ready', 'sold_out'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className={`py-2 border-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      form.status === s
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5 — Amenities */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Amenities <span className="text-gray-400 font-normal normal-case">({amenities.length} selected)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {projectAmenities.map((a) => (
                <label key={a} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{a}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 6 — Brochure */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Brochure</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="url"
                name="brochure_url"
                value={form.brochure_url}
                onChange={handleChange}
                placeholder="https://example.com/brochure.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 btn-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{mode === 'create' ? 'Creating…' : 'Saving…'}</>
            ) : (
              mode === 'create' ? 'Add Project' : 'Save Changes'
            )}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
