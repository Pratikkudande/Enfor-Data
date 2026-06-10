import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Check, X as XIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../routes/routePaths';
import { indianStates } from '../../constants/options';
import FormInput from '../../components/common/FormInput';
import RoleSelector from './RoleSelector';
import ProfilePhotoUpload from './ProfilePhotoUpload';

// Password policy rules — used both for live feedback and submit validation.
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters long', test: (p) => p.length >= 8 },
  { label: 'Contains at least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains at least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains at least one number', test: (p) => /\d/.test(p) },
  { label: 'Contains at least one special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const isPasswordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

const RegisterForm: React.FC = () => {
  const location = useLocation();
  // A plan chosen on the pricing page is passed through here; it preselects the
  // matching role and is carried on to checkout after the account is created.
  const selectedPlan = (location.state as { plan?: any; billingCycle?: string } | null)?.plan;
  const selectedBillingCycle = (location.state as { billingCycle?: string } | null)?.billingCycle || 'annual';
  const planRole: 'broker' | 'channel_partner' =
    selectedPlan?.target_role === 'channel_partner' ? 'channel_partner' : 'broker';

  const [formData, setFormData] = useState({
    firmName: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    whatsappNumber: '',
    alternativeNumber: '',
    foreignNumber: '',
    address: '',
    location: '',
    city: '',
    state: '',
    postalCode: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: planRole as 'broker' | 'channel_partner' | 'admin'
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password && !isPasswordValid(formData.password)) {
      errors.password = 'Password does not meet the requirements below';
    }

    const requiredFields: Record<string, string> = {
      firmName: 'Firm Name', firstName: 'First Name', lastName: 'Last Name',
      dateOfBirth: 'Date of Birth', whatsappNumber: 'WhatsApp Number',
      address: 'Address', location: 'Location', city: 'City',
      state: 'State', postalCode: 'Postal Code', email: 'Email', password: 'Password'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof typeof formData]) {
        errors[field] = `${label} is required`;
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.whatsappNumber && !/^\+?[\d\s-]{10,}$/.test(formData.whatsappNumber)) {
      errors.whatsappNumber = 'Please enter a valid phone number';
    }

    if (formData.postalCode && !/^\d{4,10}$/.test(formData.postalCode)) {
      errors.postalCode = 'Postal code must be 4 to 10 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors below');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        date_of_birth: formData.dateOfBirth,
        firm_name: formData.firmName,
        role: formData.role,
        whatsapp_number: formData.whatsappNumber,
        alternative_number: formData.alternativeNumber || undefined,
        foreign_number: formData.foreignNumber || undefined,
        address: formData.address,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode
      };

      await register(userData);

      // New users have no paid subscription yet. If they came from the pricing
      // page with a chosen plan, continue straight to that plan's checkout;
      // otherwise send them to the pricing page to pick one.
      if (selectedPlan) {
        navigate(`/subscription/checkout/${selectedPlan.id}`, {
          state: { plan: selectedPlan, billingCycle: selectedBillingCycle },
        });
      } else {
        navigate(ROUTES.PRICING);
      }

    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = err.message || 'Registration failed. Please try again.';

      if (err.message && err.message.includes('Field validation')) {
        const validationMatch = err.message.match(/Field validation for '(\w+)' failed on the '(\w+)' tag/);
        if (validationMatch) {
          const fieldName = validationMatch[1];
          const validationType = validationMatch[2];

          const fieldMap: Record<string, string> = {
            'Email': 'email', 'Password': 'password', 'WhatsappNumber': 'whatsappNumber',
            'FirstName': 'firstName', 'LastName': 'lastName', 'FirmName': 'firmName',
            'DateOfBirth': 'dateOfBirth', 'PostalCode': 'postalCode', 'Address': 'address',
            'Location': 'location', 'City': 'city', 'State': 'state', 'Role': 'role'
          };

          const mappedField = fieldMap[fieldName];
          const validationMessages: Record<string, string> = {
            'required': 'This field is required',
            'email': 'Please enter a valid email address',
            'min': 'Value is too short',
            'max': 'Value is too long',
            'oneof': 'Invalid value selected'
          };

          const friendlyMessage = validationMessages[validationType] || `Validation failed: ${validationType}`;

          if (mappedField) {
            setFieldErrors({ [mappedField]: friendlyMessage });
            errorMessage = `Validation error: ${fieldName} - ${friendlyMessage}`;
          }
        }
      } else if (err.message && err.message.includes(':')) {
        const parts = err.message.split(':');
        const fieldName = parts[0].trim().toLowerCase().replace(/\s+/g, '_');
        const errorMsg = parts.slice(1).join(':').trim();

        const fieldMap: Record<string, string> = {
          'email': 'email', 'password': 'password', 'whatsapp_number': 'whatsappNumber',
          'first_name': 'firstName', 'last_name': 'lastName', 'firm_name': 'firmName',
          'date_of_birth': 'dateOfBirth', 'postal_code': 'postalCode'
        };

        const mappedField = fieldMap[fieldName];
        if (mappedField) {
          setFieldErrors({ [mappedField]: errorMsg });
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    // Postal codes are numeric only, capped at the longest global length (10 digits).
    if (name === 'postalCode') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Join ENFOR DATA and grow your business</p>
      </div>

      {selectedPlan && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
          <p className="text-sm text-blue-800">
            You're signing up for the <span className="font-semibold">{selectedPlan.display_name}</span>
            {' '}— you'll continue to payment after creating your account.
          </p>
        </div>
      )}

      {/* When a plan is chosen its target role is fixed, so the selector is hidden. */}
      {!selectedPlan && (
        <RoleSelector
          role={formData.role}
          onChange={(role) => setFormData({ ...formData, role })}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <FormInput
          label="Firm Name"
          id="firmName"
          name="firmName"
          value={formData.firmName}
          onChange={handleChange}
          error={fieldErrors.firmName}
          placeholder="Enter your firm name"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={fieldErrors.firstName}
            placeholder="First name"
            maxLength={50}
            required
          />
          <FormInput
            label="Last Name"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={fieldErrors.lastName}
            placeholder="Last name"
            maxLength={50}
            required
          />
        </div>

        <FormInput
          label="Date of Birth"
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          error={fieldErrors.dateOfBirth}
          required
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          <FormInput
            label="WhatsApp Number"
            type="tel"
            id="whatsappNumber"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={handleChange}
            error={fieldErrors.whatsappNumber}
            placeholder="+91 9876543210"
            maxLength={10}
            required
          />
          <FormInput
            label="Alternative Number"
            type="tel"
            id="alternativeNumber"
            name="alternativeNumber"
            value={formData.alternativeNumber}
            onChange={handleChange}
            error={fieldErrors.alternativeNumber}
            placeholder="+91 9876543211"
            maxLength={10}
          />
          <FormInput
            label="Foreign Number"
            type="tel"
            id="foreignNumber"
            name="foreignNumber"
            value={formData.foreignNumber}
            onChange={handleChange}
            error={fieldErrors.foreignNumber}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address Information</h3>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${fieldErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              placeholder="Enter your complete address"
              required
            />
            {fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
          </div>

          <FormInput
            label="Location"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={fieldErrors.location}
            placeholder="Area/Locality"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="City"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={fieldErrors.city}
              placeholder="City"
              required
            />

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${fieldErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                required
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {fieldErrors.state && <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>}
            </div>

            <FormInput
              label="Postal Code"
              id="postalCode"
              name="postalCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={formData.postalCode}
              onChange={handleChange}
              error={fieldErrors.postalCode}
              placeholder="400001"
              required
            />
          </div>
        </div>

        <ProfilePhotoUpload
          photoPreview={photoPreview}
          onUpload={handlePhotoUpload}
          onRemove={removePhoto}
        />

        <FormInput
          label="Email ID"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
          placeholder="your@email.com"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent pr-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                placeholder="Create password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(formData.password);
                return (
                  <li
                    key={rule.label}
                    className={`flex items-center text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {ok ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    ) : (
                      <XIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                    )}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent pr-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
          </div>
        </div>

        <div className="flex items-center">
          <input type="checkbox" id="terms" className="rounded border-gray-300 text-blue-600" required />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
            I agree to the <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <><UserPlus className="h-5 w-5 mr-2" /> Create Account</>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;