import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Building2, 
  Heart, 
  MessageSquare, 
  FileText, 
  PlusCircle, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ExternalLink, 
  Check, 
  ArrowRight,
  Eye,
  Calendar,
  Lock,
  UploadCloud,
  CreditCard,
  AlertCircle,
  Compass,
  RotateCcw
} from 'lucide-react';
import { UserProfile, PropertyListing } from '../types';
import { PropertyCard } from './PropertyCard';
import { TrussetsLogo } from './TrussetsLogo';
import { userService } from '../services/userService';
import { normalizeMobile } from '../utils/phone';
import { detectUserLocation } from '../utils/geolocation';

interface ProfilePageProps {
  user: UserProfile | null;
  isAdminLoggedIn?: boolean;
  adminUser?: any | null;
  onNavigateToAdmin?: () => void;
  properties?: PropertyListing[];
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
  onSelectProperty?: (property: PropertyListing) => void;
  onOpenPostWizard: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onDeleteListing?: (id: string) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onNavigateToPlans?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user: rawUser,
  isAdminLoggedIn = false,
  adminUser = null,
  onNavigateToAdmin,
  properties = [],
  savedIds = [],
  onToggleSave = () => {},
  onSelectProperty,
  onOpenPostWizard,
  onOpenLogin,
  onLogout,
  onDeleteListing,
  onUpdateUser,
  onNavigateToPlans,
}) => {
  const user: UserProfile | null = React.useMemo(() => {
    if (rawUser) return rawUser;
    if (isAdminLoggedIn) {
      const adminName = adminUser?.name || 'TrustSets Super Administrator';
      return {
        id: adminUser?.id || 'admin-super',
        name: adminName,
        phone: adminUser?.phone || '+91 9652663763',
        email: adminUser?.email || 'trussets@gmail.com',
        role: 'owner',
        city: 'Hyderabad',
        joinedDate: 'Jan 2025',
        verifiedIdentity: true,
        avatarInitials: adminName.charAt(0).toUpperCase(),
        planName: 'Super Admin Lifetime Access',
        status: 'Active',
      };
    }
    return null;
  }, [rawUser, isAdminLoggedIn, adminUser]);

  const isAdminAccount =
    isAdminLoggedIn ||
    Boolean((rawUser as any)?.isAdmin) ||
    rawUser?.email?.toLowerCase() === 'trussets@gmail.com';

  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'inquiries' | 'plans' | 'vault' | 'settings'>('listings');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editUserType, setEditUserType] = useState<string>(user?.userType || 'Property Buyers');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editLocation, setEditLocation] = useState(user?.location || user?.city || '');
  const [editState, setEditState] = useState(user?.state || 'Telangana');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectStatus, setLocationDetectStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isLoadingSubs, setIsLoadingSubs] = useState<boolean>(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string>('');

  const handleDetectProfileLocation = async () => {
    setIsDetectingLocation(true);
    setLocationDetectStatus('');
    try {
      const loc = await detectUserLocation();
      const resolvedName = loc.displayName || loc.locality || loc.city;
      setEditLocation(resolvedName);
      if (loc.city) setEditCity(loc.city);
      setLocationDetectStatus(`Detected: ${resolvedName} (${loc.isApproximate ? 'approximate' : 'exact GPS'})`);
    } catch (err: any) {
      setLocationDetectStatus(err?.message || 'Location permission denied. Please enter your location manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Sync state whenever user prop updates from server
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setEditUserType(user.userType || 'Property Buyers');
      setEditCity(user.city || '');
      setEditLocation(user.location || user.city || '');
      setEditState(user.state || 'Telangana');
    }
  }, [user]);

  React.useEffect(() => {
    if (!user?.id) return;
    setIsLoadingSubs(true);
    fetch(`/api/user/subscriptions?userId=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setSubscriptions(data.subscriptions || []);
          setActiveSubscription(data.activeSubscription || null);
        }
      })
      .catch(err => console.error('Failed to load subscriptions:', err))
      .finally(() => setIsLoadingSubs(false));
  }, [user?.id]);

  // If user is not logged in, show clean authentication prompt
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
          <div className="flex justify-center mb-5">
            <TrussetsLogo size="md" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Log in to access your Trussets Profile
          </h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            Track your posted properties, manage inquiries directly from buyers and tenants, and access your verified document vault with 0% brokerage.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 bg-[#77101F] hover:bg-[#600c19] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Login / Sign Up</span>
            </button>
            <button
              onClick={onOpenPostWizard}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#77101F]" />
              <span>Post a Property Free</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter listings uploaded by this user (or if owner, show matching ones)
  const safeProperties = properties || [];
  const safeSavedIds = savedIds || [];
  const safeContactedIds = user.contactedPropertyIds || [];

  const myListings = safeProperties.filter((p) => 
    (p.ownerId && p.ownerId === user.id) ||
    (p.userId && p.userId === user.id) ||
    (p.uploaderName && user.name && p.uploaderName.toLowerCase().includes(user.name.toLowerCase())) || 
    p.id.startsWith('prop-user-') ||
    p.id.startsWith('prop-custom-')
  );

  const savedPropertiesList = safeProperties.filter((p) => safeSavedIds.includes(p.id));

  // Inquiries mock
  const contactedList = safeProperties.filter((p) => 
    safeContactedIds.includes(p.id) || p.id === 'prop-1' || p.id === 'rent-1'
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!user) return;

    const trimmedPhone = editPhone.trim();
    const newNorm = normalizeMobile(trimmedPhone);
    if (!newNorm) {
      setSaveError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (editPassword.trim() !== '') {
      if (editPassword.length < 6) {
        setSaveError('New password must be at least 6 characters long.');
        return;
      }
      if (editPassword !== editConfirmPassword) {
        setSaveError('New password and confirm password do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatedUser = await userService.updateProfile({
        userId: user.id,
        name: editName.trim() || user.name,
        email: editEmail.trim() || user.email,
        phone: trimmedPhone,
        userType: editUserType || user.userType,
        city: editCity.trim() || user.city,
        location: editLocation.trim() || editCity.trim() || user.location,
        state: editState.trim() || user.state,
        newPassword: editPassword.trim() !== '' ? editPassword : undefined,
      });

      onUpdateUser?.(updatedUser);
      setEditPassword('');
      setEditConfirmPassword('');
      setIsEditing(false);
      setSaveSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {saveSuccessMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {saveSuccessMsg}
          </span>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#77101F] to-[#540B16] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
              {user.avatarInitials}
            </div>

            {/* Basic Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {user.name}
                </h1>
                {user.verifiedIdentity && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    KYC Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {user.phone}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {[user.location || user.city, user.state].filter(Boolean).join(', ')}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member since {user.joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isAdminAccount && onNavigateToAdmin && (
              <button
                id="profile-admin-portal-btn"
                onClick={onNavigateToAdmin}
                className="px-4 py-2 bg-[#77101F] hover:bg-[#600C18] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
            <button
              id="profile-edit-details-btn"
              onClick={() => {
                setEditName(user.name || '');
                setEditEmail(user.email || '');
                setEditPhone(user.phone || '');
                setEditUserType(user.userType || 'Property Buyers');
                setEditCity(user.city || '');
                setEditLocation(user.location || user.city || '');
                setEditState(user.state || 'Telangana');
                setEditPassword('');
                setEditConfirmPassword('');
                setSaveError('');
                setIsEditing(true);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Edit Details
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#77101F] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xl font-black text-slate-900 block">{myListings.length}</span>
            <span className="text-xs text-slate-500 font-medium">My Posted Properties</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xl font-black text-slate-900 block">{savedIds.length}</span>
            <span className="text-xs text-slate-500 font-medium">Saved / Shortlist</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xl font-black text-[#77101F] block">0%</span>
            <span className="text-xs text-slate-500 font-medium">Brokerage Commission</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xl font-black text-emerald-600 block">100%</span>
            <span className="text-xs text-slate-500 font-medium">Direct Inquiries</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (All Profile Fields + Password) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Edit Profile &amp; Password
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your personal details, contact info, location, and account password.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {saveError && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl font-semibold border border-red-200">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@example.com (optional)"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98480 12345"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Locality / Full Address</label>
                  <button
                    type="button"
                    onClick={handleDetectProfileLocation}
                    disabled={isDetectingLocation}
                    className="text-[11px] font-bold text-[#77101F] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isDetectingLocation ? 'Detecting...' : 'Use Current Location'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Madhapur, Hitech City, Hyderabad"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
                {locationDetectStatus && (
                  <p className="text-[11px] text-slate-500 mt-1">{locationDetectStatus}</p>
                )}
              </div>

              {/* Password Change Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#77101F]" />
                    <span>Change / Set Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showEditPassword ? 'Hide Password' : 'Show Password'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Minimum 6 characters. Leave password fields empty if you only want to update your profile info.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSaveError('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#77101F] text-white text-xs font-bold rounded-xl hover:bg-[#600c19] cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSaving ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'listings'
              ? 'border-[#77101F] text-[#77101F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Posted Properties ({myListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'saved'
              ? 'border-[#77101F] text-[#77101F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved / Shortlisted ({savedPropertiesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'inquiries'
              ? 'border-[#77101F] text-[#77101F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Direct Inquiries & Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'plans'
              ? 'border-[#77101F] text-[#77101F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>My Plan / Active Plans</span>
          {activeSubscription ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
              ACTIVE
            </span>
          ) : user.planName ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              {user.status || 'Active'}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'vault'
              ? 'border-[#77101F] text-[#77101F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Document Vault & KYC</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-[#77101F] text-[#77101F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Payment History & Account Settings</span>
        </button>
      </div>

      {/* Tab 1: My Posted Properties */}
      {activeTab === 'listings' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Active Real Estate Listings</h2>
              <p className="text-xs text-slate-500">
                All properties posted from your account receive 100% direct buyer and tenant inquiries with zero brokerage.
              </p>
            </div>
            <button
              onClick={onOpenPostWizard}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer w-fit"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Property (Free)</span>
            </button>
          </div>

          {myListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((prop) => (
                <div key={prop.id} className="relative group">
                  <PropertyCard
                    property={prop}
                    isSaved={savedIds.includes(prop.id)}
                    onToggleSave={onToggleSave}
                    onSelectProperty={onSelectProperty}
                  />
                  {onDeleteListing && (
                    <button
                      onClick={() => onDeleteListing(prop.id)}
                      className="absolute top-3 right-12 z-20 p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-full shadow-md border border-slate-200 transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Building2 className="w-7 h-7 text-[#77101F]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">You haven't posted any properties yet</h3>
              <p className="text-xs text-slate-500 mt-1.5 mb-5 max-w-md mx-auto">
                Sell or rent your flat, villa, open plot, or commercial space with zero brokerage and verified title deeds.
              </p>
              <button
                onClick={onOpenPostWizard}
                className="px-6 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Property for Sale or Rent</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Properties */}
      {activeTab === 'saved' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Shortlisted Properties ({savedPropertiesList.length})</h2>
            <p className="text-xs text-slate-500">
              Properties you have bookmarked for direct owner inquiries and site visits.
            </p>
          </div>

          {savedPropertiesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPropertiesList.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isSaved={true}
                  onToggleSave={onToggleSave}
                  onSelectProperty={onSelectProperty}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Your shortlist is empty</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Click the heart icon on any property card to save it for quick reference.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Direct Owner Contact History</h2>
            <p className="text-xs text-slate-500">
              Direct phone and WhatsApp inquiries made to verified property owners with zero brokerage.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {contactedList.map((prop) => (
              <div key={prop.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3.5">
                  <img
                    src={prop.images[0]}
                    alt={prop.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#77101F] bg-red-50 px-2 py-0.5 rounded-sm">
                      {prop.transactionType === 'buy' ? 'For Sale' : 'For Rent'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{prop.title}</h4>
                    <p className="text-xs text-slate-500">{prop.locality}, {prop.city} • <strong className="text-slate-800">{prop.priceDisplay}</strong></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Owner: {prop.uploaderName} • {prop.ownerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectProperty?.(prop)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    View Property
                  </button>
                  <a
                    href={`tel:${prop.ownerPhone}`}
                    className="px-3.5 py-2 bg-[#77101F] text-white text-xs font-bold rounded-lg hover:bg-[#600c19] transition-colors"
                  >
                    Call Owner
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Document Vault & KYC */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Legal Document Vault & KYC</h2>
            <p className="text-xs text-slate-500">
              Trussets verifies official government property documents to provide 0% brokerage direct connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Government Identity (Aadhaar / PAN)</h3>
                    <p className="text-xs text-slate-500">Verified for direct owner identity authentication</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Aadhaar masked document ending in <strong>•••• 4921</strong> authenticated.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Registered Title Deed / Sale Deed</h3>
                    <p className="text-xs text-slate-500">Required for 100% verified resale listings</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Encumbrance Certificate (EC) checked with zero registered legal liens or mortgages.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: My Plan / Active Plans (Requirement 11) */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Plan / Active Plans</h2>
              <p className="text-xs text-slate-500">
                Authoritative server-side verified subscription status, valid entitlements, and direct owner unlocks.
              </p>
            </div>
            {onNavigateToPlans && (
              <button
                type="button"
                onClick={onNavigateToPlans}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Explore / Upgrade Plans</span>
              </button>
            )}
          </div>

          {/* Active Plan Card */}
          {activeSubscription || user.planName ? (
            <div className="bg-white rounded-3xl border border-emerald-300 p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-slate-900">
                        {activeSubscription?.planName || user.planName}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        (activeSubscription?.status === 'ACTIVE' || user.status === 'Active')
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(activeSubscription?.status === 'ACTIVE' || user.status === 'Active') ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Plan Type: <strong className="text-slate-700">{activeSubscription?.planType || user.planType || 'Buying'}</strong> • 0% Brokerage Guarantee
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToPlans && (
                    <button
                      type="button"
                      onClick={onNavigateToPlans}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Renew / Change Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Specific Plan Details Grid (Requirement 11) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Plan Start Date
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {activeSubscription?.startsAt?.split('T')[0] || user.planStartDate || 'Activated'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                    Plan Expiry Date
                  </span>
                  <span className="text-sm font-black text-emerald-900">
                    {activeSubscription?.expiresAt?.split('T')[0] || user.planEndDate || 'Active'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Listings Allowed
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {activeSubscription?.listingsAllowed || user.listingsAllowed || 5} Properties
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Remaining Unlocks
                  </span>
                  <span className="text-sm font-black text-[#77101F]">
                    {Math.max(0, (activeSubscription?.listingsAllowed || user.listingsAllowed || 5) - (activeSubscription?.listingsUsed || user.listingsUsed || 0))} Available
                  </span>
                </div>
              </div>

              {/* Transaction ID if available */}
              {(activeSubscription?.purchaseTransactionId || user.payments?.[0]?.transactionId) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span>
                    Transaction ID: <strong className="font-mono text-slate-700">{activeSubscription?.purchaseTransactionId || user.payments?.[0]?.transactionId}</strong>
                  </span>
                  <span>
                    Invoice: <strong className="font-mono text-slate-700">{activeSubscription?.invoiceNumber || user.payments?.[0]?.invoiceNumber || 'INV-2026'}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Active Subscription Plan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Subscribe to a verified TrustSets buyer or rental plan to unlock direct owner WhatsApp contact details, exact addresses, and title deeds.
              </p>
              {onNavigateToPlans && (
                <button
                  type="button"
                  onClick={onNavigateToPlans}
                  className="mt-4 px-5 py-2.5 bg-[#77101F] text-white text-xs font-bold rounded-xl hover:bg-[#600c19] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>View All Plans</span>
                </button>
              )}
            </div>
          )}

          {/* Subscriptions History List */}
          {subscriptions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Subscription History</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {subscriptions.map((sub: any) => (
                  <div key={sub.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sub.planName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sub.planType} Plan • Valid from {sub.startsAt?.split('T')[0]} to {sub.expiresAt?.split('T')[0]}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">₹{sub.price}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.purchaseTransactionId}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Payment History & Account Settings (Includes Google Play Compliant Account Deletion) */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Payment History */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Payment History & Tax Invoices</h2>
            <p className="text-xs text-slate-500 mb-4">
              Complete record of your Trussets subscription plan transactions synchronized with our production database.
            </p>

            {user.payments && user.payments.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {user.payments.map((pay: any, idx: number) => (
                  <div key={pay.id || idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{pay.plan}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {pay.status || 'Success'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Date: {pay.paymentDate} • Method: {pay.paymentMethod || 'Online'} • Invoice: <span className="font-mono">{pay.invoiceNumber || 'INV-2026'}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-black text-slate-900">₹{pay.grandTotal || pay.amount}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{pay.transactionId}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                No payment records found on this account yet.
              </div>
            )}
          </div>

          {/* Account Settings & Privacy */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Account Information & Security</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Registered Mobile Number</span>
                <span className="text-slate-900 font-bold text-sm">{user.phone}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Email Address</span>
                <span className="text-slate-900 font-bold text-sm">{user.email || 'Not provided (Mobile-only account)'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Saved Location</span>
                <span className="text-slate-900 font-bold text-sm">{[user.location || user.city, user.state].filter(Boolean).join(', ')}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Account Verification</span>
                <span className="text-emerald-700 font-bold text-sm">{user.verifiedIdentity ? 'Verified Account' : 'Mobile Verified'}</span>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Update Profile / Password
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Device</span>
              </button>
            </div>
          </div>

          {/* Permanent Account Deletion (Google Play Data Safety Compliance) */}
          {!isAdminAccount && (
            <div className="bg-red-50/60 rounded-2xl border border-red-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-red-900 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-red-700" />
                    <span>Delete Trussets Account & Personal Data</span>
                  </h3>
                  <p className="text-xs text-red-700/90 mt-1 max-w-2xl">
                    Permanently delete your Trussets account, profile details, saved properties, and posted listings from our production database. This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmText('');
                    setDeleteReason('');
                    setDeleteAccountError('');
                    setIsDeleteAccountModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permanent Account Deletion Confirmation Modal */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>Confirm Account Deletion</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Deleting your account (<strong className="text-slate-900">{user.phone}</strong>) will permanently remove your profile, saved properties, active subscriptions, and posted listings from Trussets.
            </p>

            {deleteAccountError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                {deleteAccountError}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for leaving (Optional)
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Found a property, privacy preference"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type <span className="font-mono text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  setDeleteAccountError('');
                  try {
                    const res = await fetch('/api/user/delete-account', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.id,
                        phone: user.phone,
                        reason: deleteReason.trim(),
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || 'Failed to delete account.');
                    }
                    setIsDeleteAccountModalOpen(false);
                    onLogout();
                  } catch (err: any) {
                    setDeleteAccountError(err?.message || 'Could not delete account. Please try again.');
                  } finally {
                    setIsDeletingAccount(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
