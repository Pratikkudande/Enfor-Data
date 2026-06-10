import React, { useRef } from 'react';
import {
  X, User, Phone, Mail, MapPin, Briefcase, FileText,
  Upload, AlertCircle, Loader2, Image, Clock,
} from 'lucide-react';

export interface StaffFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string;
  experience_years: string;
  status: 'available' | 'employed' | 'inactive';
  type: 'available' | 'required';
  location: string;
  address: string;
  description: string;
  resume: File | null;
  photo: File | null;
}

interface StaffFormProps {
  formData: StaffFormData;
  editingId: string | null;
  submitting: boolean;
  formError: string | null;
  onInputChange: (field: keyof StaffFormData, value: string) => void;
  onFileChange: (field: 'resume' | 'photo', file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    err ? 'border-red-400' : 'border-gray-300'
  }`;

const ROLES = [
  'Real Estate Agent',
  'Property Manager',
  'Sales Executive',
  'Documentation Specialist',
  'Site Supervisor',
  'Marketing Executive',
  'Telecaller',
  'Office Assistant',
  'Accountant',
  'Other',
];

const StaffForm: React.FC<StaffFormProps> = ({
  formData,
  editingId,
  submitting,
  formError,
  onInputChange,
  onFileChange,
  onSubmit,
  onCancel,
}) => {
  const resumeRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const isRequired = formData.type === 'required';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Staff' : 'Add Staff'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
            {formError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Type toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'available', label: 'Available Staff', desc: 'Staff available for hire' },
                  { value: 'required', label: 'Staff Required', desc: 'Recruitment requirement' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onInputChange('type', opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.type === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isRequired ? 'Position Title' : 'First Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => onInputChange('first_name', e.target.value)}
                    placeholder={isRequired ? 'e.g. Sales Executive' : 'First name'}
                    maxLength={50}
                    className={`${inputCls()} pl-9`}
                  />
                </div>
              </div>
              {!isRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => onInputChange('last_name', e.target.value)}
                    placeholder="Last name"
                    maxLength={50}
                    className={inputCls()}
                  />
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role / Position <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => onInputChange('role', e.target.value)}
                  className={`${inputCls()} pl-9 bg-white`}
                >
                  <option value="">Select role…</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Experience (Years)
                  {isRequired && <span className="text-gray-400 font-normal text-xs">(minimum required)</span>}
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={(e) => onInputChange('experience_years', e.target.value)}
                placeholder="e.g. 3"
                className={inputCls()}
              />
            </div>

            {/* Contact — only for available staff */}
            {!isRequired && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => onInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      maxLength={10}
                      className={`${inputCls()} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => onInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className={`${inputCls()} pl-9`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => onInputChange('location', e.target.value)}
                  placeholder="City, Area"
                  className={`${inputCls()} pl-9`}
                />
              </div>
            </div>

            {/* Address — only for available staff */}
            {!isRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => onInputChange('address', e.target.value)}
                  placeholder="Full address"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {isRequired ? 'Job Description / Requirements' : 'About / Skills'}
                </span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                placeholder={
                  isRequired
                    ? 'Describe the role, responsibilities, and requirements...'
                    : 'Describe skills, experience, and expertise...'
                }
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Status — only for available staff */}
            {!isRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => onInputChange('status', e.target.value)}
                  className={`${inputCls()} bg-white`}
                >
                  <option value="available">Available</option>
                  <option value="employed">Currently Employed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            {/* Photo upload — only for available staff */}
            {!isRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" />
                    Profile Photo
                  </span>
                </label>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFileChange('photo', e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <div className="text-sm text-gray-600">
                    {formData.photo ? (
                      <span className="text-blue-600 font-medium">{formData.photo.name}</span>
                    ) : (
                      'Click to upload photo'
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 5MB</div>
                </button>
              </div>
            )}

            {/* Resume upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {isRequired ? 'Sample Resume / JD (Optional)' : 'Resume / CV'}
                </span>
              </label>
              <input
                ref={resumeRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => onFileChange('resume', e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => resumeRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-gray-600">
                  {formData.resume ? (
                    <span className="text-blue-600 font-medium">{formData.resume.name}</span>
                  ) : (
                    'Click to upload resume'
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX up to 10MB</div>
              </button>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-1 pb-1">
              <button
                type="button"
                onClick={onCancel}
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
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editingId ? (
                  'Update Staff'
                ) : (
                  'Add Staff'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffForm;
