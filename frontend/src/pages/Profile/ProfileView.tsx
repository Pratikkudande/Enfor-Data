import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mail, Phone, MapPin, Calendar, Briefcase, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileApi, UpdateProfileRequest } from '../../services/profileApi';
import { apiClient } from '../../services/api';
import { ENV } from '../../config/env';

const resolvePhoto = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ENV.API_URL}${path}`;
};

const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(resolvePhoto(user?.profile_image));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    propertiesCount: 0,
    clientsCount: 0,
    projectsCount: 0
  });
  const isChannelPartner = user?.role === 'channel_partner';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh the user from the server (GET /auth/me) when opening the profile,
  // so it shows the latest data rather than the cached login snapshot.
  const didRefreshUser = useRef(false);
  useEffect(() => {
    if (didRefreshUser.current) return;
    didRefreshUser.current = true;
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
    company: user?.company_name || '',
    experience: String(user?.years_experience || ''),
    specialization: user?.specializations || '',
  });

  // Fetch the property/client counts once — they're for the current user, so we
  // don't refetch when the user object is refreshed or under StrictMode re-mounts.
  const didFetchStats = useRef(false);
  useEffect(() => {
    if (!user || didFetchStats.current) return;
    didFetchStats.current = true;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Single lightweight endpoint that returns just the counts.
        const res = await apiClient.getProfileStats();
        setStats({
          propertiesCount: res?.properties_count || 0,
          clientsCount: res?.clients_count || 0,
          projectsCount: res?.projects_count || 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Don't show error toast for stats, just keep default values
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        company: user.company_name || '',
        experience: String(user.years_experience || ''),
        specialization: user.specializations || '',
      });
      setPhotoUrl(resolvePhoto(user.profile_image));
    }
  }, [user]);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'broker':         return 'Real Estate Broker';
      case 'channel_partner': return 'Channel Partner';
      case 'admin':          return 'Administrator';
      default:               return role;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // ── Photo upload ─────────────────────────────────────────────────────────
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast({ type: 'error', title: 'Invalid file', message: 'Please upload a JPG, PNG or WebP image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File too large', message: 'Image must be less than 5 MB.' });
      return;
    }

    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);
    setUploading(true);

    try {
      const res = await profileApi.uploadProfilePhoto(file);
      if (res?.data?.profile_image) {
        setPhotoUrl(resolvePhoto(res.data.profile_image));
      }
      // Refresh the auth user so the navbar avatar updates immediately.
      await refreshUser();
      showToast({ type: 'success', title: 'Photo Updated', message: 'Profile photo updated successfully.' });
    } catch (err) {
      setPhotoUrl(resolvePhoto(user?.profile_image)); // revert
      showToast({ type: 'error', title: 'Upload Failed', message: 'Failed to upload photo. Please try again.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Profile form ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const updateData: UpdateProfileRequest = {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        bio: profileData.bio,
        company: profileData.company,
        experience: profileData.experience,
        specialization: profileData.specialization,
      };
      await profileApi.updateProfile(updateData);
      // Refresh user data from the server to get the latest information
      await refreshUser();
      setIsEditing(false);
      showToast({ type: 'success', title: 'Profile Updated', message: 'Your profile has been updated successfully.' });
    } catch {
      showToast({ type: 'error', title: 'Update Failed', message: 'Failed to update your profile. Please try again.' });
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
      company: user?.company_name || '',
      experience: String(user?.years_experience || ''),
      specialization: user?.specializations || '',
    });
    setIsEditing(false);
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const readCls = 'flex items-center gap-2 p-3 bg-gray-50 rounded-lg';

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 text-sm">Manage your personal information and preferences</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 btn-primary">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={user?.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide broken image and show initials fallback
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.profile-fallback');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  <span className={`profile-fallback text-white font-bold text-2xl ${photoUrl ? 'absolute inset-0 items-center justify-center' : 'flex'}`}
                        style={{ display: photoUrl ? 'none' : 'flex' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Camera button — always visible */}
                <button
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  title="Change profile photo"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-md"
                >
                  {uploading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Camera className="w-4 h-4" />
                  }
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
              <p className="text-blue-600 font-medium mb-2">{getRoleDisplayName(user?.role || '')}</p>
              <p className="text-gray-500 text-xs break-all">{user?.email}</p>
              {uploading && (
                <p className="text-xs text-blue-500 mt-2 animate-pulse">Uploading photo…</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {isChannelPartner ? (
                // Channel partners work with projects, not properties/clients.
                <div className="text-center">
                  {loading ? (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">{stats.projectsCount}</p>
                  )}
                  <p className="text-xs text-gray-500">My Projects</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    {loading ? (
                      <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">{stats.propertiesCount}</p>
                    )}
                    <p className="text-xs text-gray-500">Own Properties</p>
                  </div>
                  <div>
                    {loading ? (
                      <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-green-600">{stats.clientsCount}</p>
                    )}
                    <p className="text-xs text-gray-500">Own Clients</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing
                  ? <input type="text" value={profileData.name} onChange={e => handleInputChange('name', e.target.value)} className={inputCls} />
                  : <div className={readCls}><span className="text-gray-900">{profileData.name}</span></div>
                }
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className={`${readCls} min-w-0`}>
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 text-sm break-all min-w-0">{profileData.email}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditing
                  ? <input type="tel" value={profileData.phone} onChange={e => handleInputChange('phone', e.target.value.replace(/\D/g, ''))} maxLength={10} className={inputCls} placeholder="Enter phone number" />
                  : <div className={readCls}><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-900">{profileData.phone || 'Not provided'}</span></div>
                }
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing
                  ? <input type="text" value={profileData.address} onChange={e => handleInputChange('address', e.target.value)} className={inputCls} placeholder="Enter address" />
                  : <div className={readCls}><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-900">{profileData.address || 'Not provided'}</span></div>
                }
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                {isEditing
                  ? <input type="text" value={profileData.company} onChange={e => handleInputChange('company', e.target.value)} className={inputCls} placeholder="Enter company name" />
                  : <div className={readCls}><Briefcase className="w-4 h-4 text-gray-400" /><span className="text-gray-900">{profileData.company || 'Not provided'}</span></div>
                }
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                {isEditing
                  ? <input type="text" value={profileData.experience} onChange={e => handleInputChange('experience', e.target.value)} className={inputCls} placeholder="e.g., 5 years" />
                  : <div className={readCls}><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-900">{profileData.experience || 'Not provided'}</span></div>
                }
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              {isEditing
                ? <textarea value={profileData.bio} onChange={e => handleInputChange('bio', e.target.value)} rows={4} className={inputCls} placeholder="Tell us about yourself..." />
                : <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-900">{profileData.bio || 'No bio provided'}</p></div>
              }
            </div>

            {/* Specialization */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              {isEditing
                ? <input type="text" value={profileData.specialization} onChange={e => handleInputChange('specialization', e.target.value)} className={inputCls} placeholder="e.g., Residential Properties, Commercial Real Estate" />
                : <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-900">{profileData.specialization || 'Not specified'}</p></div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
