import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../services/adminApi';
import { brandService } from '../../services/brandService';
import {
  Settings,
  Shield,
  Save,
  Key,
  Database,
  Download,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Globe,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    platformName: 'TrustSets',
    supportEmail: 'support@trussets.in',
    verificationEmail: '',
    supportPhone: '+91 96526 63763',
    supportSecondaryPhone: '',
    supportWhatsApp: '+91 96526 63763',
    supportHours: 'Monday – Saturday, 9:00 AM – 8:00 PM IST',
    operationalCenterTitle: 'Hyderabad Operational Center',
    operationalAddress: 'Hyderabad, Telangana',
    currency: 'INR (₹)',
    defaultValidityDays: 30,
    deedVerificationSLAHours: 24,
    maxPropertyImages: 15,
    autoPublishVerifiedListings: true,
    maintenanceMode: false,
    logoUrl: '',
    logoWhiteUrl: '',
    faviconUrl: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Asset upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingLogoWhite, setIsUploadingLogoWhite] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoWhiteInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Add New Admin State
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('super_admin');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminError, setNewAdminError] = useState('');
  const [newAdminSuccess, setNewAdminSuccess] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await adminApi.getAdmins();
      if (res.staff) setAdminsList(res.staff);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getSettings();
      if (res.settings) {
        setSettings({
          platformName: 'TrustSets',
          supportEmail: 'support@trussets.in',
          verificationEmail: '',
          supportPhone: '+91 96526 63763',
          supportSecondaryPhone: '',
          supportWhatsApp: '+91 96526 63763',
          supportHours: 'Monday – Saturday, 9:00 AM – 8:00 PM IST',
          operationalCenterTitle: 'Hyderabad Operational Center',
          operationalAddress: 'Hyderabad, Telangana',
          currency: 'INR (₹)',
          defaultValidityDays: 30,
          deedVerificationSLAHours: 24,
          maxPropertyImages: 15,
          autoPublishVerifiedListings: true,
          maintenanceMode: false,
          logoUrl: '',
          logoWhiteUrl: '',
          faviconUrl: '',
          ...res.settings,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAdminError('');
    setNewAdminSuccess('');
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setNewAdminError('Name, email, and password are required.');
      return;
    }
    if (newAdminPassword.length < 6) {
      setNewAdminError('Password must be at least 6 characters.');
      return;
    }
    try {
      setIsCreatingAdmin(true);
      await adminApi.createAdmin({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        phone: newAdminPhone.trim(),
        role: newAdminRole,
        password: newAdminPassword,
      });
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminPassword('');
      setNewAdminSuccess('New admin created successfully!');
      fetchAdmins();
      setTimeout(() => setNewAdminSuccess(''), 4000);
    } catch (err: any) {
      setNewAdminError(err.message || 'Failed to add new admin');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: 'logo' | 'logoWhite' | 'favicon'
  ) => {
    setUploadError(null);
    try {
      if (type === 'logo') setIsUploadingLogo(true);
      if (type === 'logoWhite') setIsUploadingLogoWhite(true);
      if (type === 'favicon') setIsUploadingFavicon(true);

      let res: any;
      if (type === 'logo') {
        res = await adminApi.uploadLogo(file);
      } else {
        res = await adminApi.uploadImage(file, type);
      }

      if (res && res.url) {
        if (type === 'logo') {
          const newUrl = res.url;
          setSettings((prev: any) => ({ ...prev, logoUrl: newUrl }));
          await adminApi.updateSettings({ ...settings, logoUrl: newUrl });
          brandService.setSettings({ logoUrl: newUrl, logoUpdatedAt: Date.now() });
          await brandService.syncWithServer();
        } else if (type === 'logoWhite') {
          const newUrl = res.url;
          setSettings((prev: any) => ({ ...prev, logoWhiteUrl: newUrl }));
          await adminApi.updateSettings({ ...settings, logoWhiteUrl: newUrl });
          brandService.setSettings({ logoWhiteUrl: newUrl, logoUpdatedAt: Date.now() });
          await brandService.syncWithServer();
        } else if (type === 'favicon') {
          const newUrl = res.url;
          setSettings((prev: any) => ({ ...prev, faviconUrl: newUrl }));
          await adminApi.updateSettings({ ...settings, faviconUrl: newUrl });
          brandService.applyFavicon(newUrl);
          brandService.setSettings({ faviconUrl: newUrl, logoUpdatedAt: Date.now() });
          await brandService.syncWithServer();
        }
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      if (type === 'logoWhite') setIsUploadingLogoWhite(false);
      if (type === 'favicon') setIsUploadingFavicon(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await adminApi.updateSettings(settings);
      
      // Propagate brand & Help Center contact changes to browser and components immediately
      brandService.setSettings({
        platformName: settings.platformName || 'TrustSets',
        logoUrl: settings.logoUrl || '',
        logoWhiteUrl: settings.logoWhiteUrl || '',
        faviconUrl: settings.faviconUrl || '',
        logoUpdatedAt: Date.now(),
        supportEmail: settings.supportEmail || 'support@trussets.in',
        verificationEmail: settings.verificationEmail || '',
        supportPhone: settings.supportPhone || '+91 96526 63763',
        supportSecondaryPhone: settings.supportSecondaryPhone || '',
        supportWhatsApp: settings.supportWhatsApp || '+91 96526 63763',
        supportHours: settings.supportHours || 'Monday – Saturday, 9:00 AM – 8:00 PM IST',
        operationalCenterTitle: settings.operationalCenterTitle || 'Hyderabad Operational Center',
        operationalAddress: settings.operationalAddress || 'Hyderabad, Telangana',
      });
      await brandService.syncWithServer();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await adminApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDownloadBackup = () => {
    adminApi.downloadBackup();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Platform Configuration & Security
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global marketplace branding, logos & favicon, admin credentials, deed SLAs, and disaster recovery exports.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings & Branding Saved!
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 text-red-800 rounded-2xl text-xs font-semibold border border-red-200 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-800 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Platform settings and Brand Assets form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            
            {/* BRANDING ASSETS: LOGO & FAVICON */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#77101F]" />
                  Brand Identity & Visual Assets
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  PNG, SVG, JPG, ICO or WebP
                </span>
              </div>

              {/* 1. Main Logo (Standard - Light Background) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Main Platform Logo (Standard)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Used on navigation headers, user profile, and light backgrounds.
                    </p>
                  </div>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        const nextSettings = { ...settings, logoUrl: '' };
                        setSettings(nextSettings);
                        await adminApi.updateSettings(nextSettings);
                        brandService.setSettings({ logoUrl: '/trussets-logo.svg', logoUpdatedAt: Date.now() });
                        await brandService.syncWithServer();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Reset to default logo"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Visual Preview */}
                  <div className="sm:col-span-5 h-20 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Custom Main Logo Preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <img
                        src="/TRUSETS-logo-website.png"
                        alt="Default Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>

                  {/* Upload Controls only - direct photo upload */}
                  <div className="sm:col-span-7 space-y-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logo');
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs cursor-pointer transition-colors hover:border-[#77101F] disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-[#77101F]" />
                      {isUploadingLogo
                        ? 'Uploading Logo Photo...'
                        : settings.logoUrl
                        ? 'Change Logo Photo'
                        : 'Upload Logo Photo'}
                    </button>

                    {settings.logoUrl ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Custom photo logo active</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 pl-1 font-medium">
                        Default TrustSets vector logo active
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. White / Inverse Logo (Dark Background) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Main Logo - White / Inverse Variant
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Used on dark surfaces like footer, dark hero banners, and dark modals.
                    </p>
                  </div>
                  {settings.logoWhiteUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        const nextSettings = { ...settings, logoWhiteUrl: '' };
                        setSettings(nextSettings);
                        await adminApi.updateSettings(nextSettings);
                        brandService.setSettings({ logoWhiteUrl: '/trussets-logo-white.svg', logoUpdatedAt: Date.now() });
                        await brandService.syncWithServer();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Reset to default white logo"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Visual Preview in Dark Box */}
                  <div className="sm:col-span-5 h-20 bg-slate-900 rounded-xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                    {settings.logoWhiteUrl ? (
                      <img
                        src={settings.logoWhiteUrl}
                        alt="Custom White Logo Preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <img
                        src="/trussets-logo-white.png"
                        alt="Default White Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>

                  {/* Upload Controls only - direct photo upload */}
                  <div className="sm:col-span-7 space-y-2">
                    <input
                      type="file"
                      ref={logoWhiteInputRef}
                      accept="image/png,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logoWhite');
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => logoWhiteInputRef.current?.click()}
                      disabled={isUploadingLogoWhite}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs cursor-pointer transition-colors hover:border-[#77101F] disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-[#77101F]" />
                      {isUploadingLogoWhite
                        ? 'Uploading White Logo...'
                        : settings.logoWhiteUrl
                        ? 'Change White Logo Photo'
                        : 'Upload White Logo Photo'}
                    </button>

                    {settings.logoWhiteUrl ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Custom white logo active</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 pl-1 font-medium">
                        Default white vector logo active
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Browser Favicon */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Browser Favicon (Tab Icon)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Shown on browser tabs, bookmarks bar, and shortcut icons.
                    </p>
                  </div>
                  {settings.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, faviconUrl: '' });
                        brandService.applyFavicon('/favicon.svg');
                        brandService.setSettings({ faviconUrl: '' });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Reset to default favicon"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Browser Tab Simulation Preview */}
                  <div className="sm:col-span-5 bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Browser Tab Preview
                    </span>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80">
                      <img
                        src={settings.faviconUrl || '/favicon.svg'}
                        alt="Favicon"
                        className="w-4 h-4 shrink-0 rounded-xs object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/favicon.svg';
                        }}
                      />
                      <span className="text-[11px] font-semibold text-slate-800 truncate">
                        {settings.platformName || 'TrustSets'} | Direct
                      </span>
                    </div>
                  </div>

                  {/* Upload Controls only - direct photo upload */}
                  <div className="sm:col-span-7 space-y-2">
                    <input
                      type="file"
                      ref={faviconInputRef}
                      accept="image/x-icon,image/png,image/svg+xml,image/webp,.ico"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'favicon');
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={isUploadingFavicon}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs cursor-pointer transition-colors hover:border-[#77101F] disabled:opacity-50"
                    >
                      <Globe className="w-4 h-4 text-[#77101F]" />
                      {isUploadingFavicon
                        ? 'Uploading Favicon Photo...'
                        : settings.faviconUrl
                        ? 'Change Favicon Photo'
                        : 'Upload Favicon Photo'}
                    </button>

                    {settings.faviconUrl ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Custom favicon active</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 pl-1 font-medium">
                        Default vector tab favicon active
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#77101F]" />
                Help Center &amp; Platform Contact Channels
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Any changes made here immediately update the Help Center &ldquo;Get In Touch&rdquo; cards and public footer contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={settings.platformName || ''}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Center Title</label>
                <input
                  type="text"
                  value={settings.operationalCenterTitle || ''}
                  onChange={(e) => setSettings({ ...settings, operationalCenterTitle: e.target.value })}
                  placeholder="e.g. Hyderabad Operational Center"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Operational Center Address / Location</label>
                <input
                  type="text"
                  value={settings.operationalAddress || ''}
                  onChange={(e) => setSettings({ ...settings, operationalAddress: e.target.value })}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Direct Support Helpline (Primary Phone)</label>
                <input
                  type="text"
                  value={settings.supportPhone || ''}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  placeholder="+91 96526 63763"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Helpline / WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.supportSecondaryPhone || settings.supportWhatsApp || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportSecondaryPhone: e.target.value,
                      supportWhatsApp: e.target.value,
                    })
                  }
                  placeholder="+91 96526 63763"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Helpline Operating Hours</label>
                <input
                  type="text"
                  value={settings.supportHours || ''}
                  onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                  placeholder="Monday – Saturday, 9:00 AM – 8:00 PM IST"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Support Email Correspondence</label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  placeholder="support@trussets.in"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification / Secondary Email (Optional)</label>
                <input
                  type="email"
                  value={settings.verificationEmail || ''}
                  onChange={(e) => setSettings({ ...settings, verificationEmail: e.target.value })}
                  placeholder="verify@trussets.in"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 mb-3">Governance & SLA Limits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deed SLA (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings.deedVerificationSLAHours || 24}
                    onChange={(e) =>
                      setSettings({ ...settings, deedVerificationSLAHours: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Photos / Listing</label>
                  <input
                    type="number"
                    min={3}
                    value={settings.maxPropertyImages || 15}
                    onChange={(e) =>
                      setSettings({ ...settings, maxPropertyImages: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Plan Days</label>
                  <input
                    type="number"
                    min={7}
                    value={settings.defaultValidityDays || 30}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultValidityDays: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Auto-Publish Verified Listings</div>
                <div className="text-[11px] text-slate-500">
                  Instantly publish properties to public search as soon as deed check passes.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPublishVerifiedListings}
                onChange={(e) =>
                  setSettings({ ...settings, autoPublishVerifiedListings: e.target.checked })
                }
                className="w-4 h-4 text-[#77101F] rounded cursor-pointer"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Configurations...' : 'Save Configurations'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security & Backups */}
        <div className="space-y-6">
          {/* Password Update */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-700" />
              Update Master Credentials
            </h3>

            {passwordError && (
              <div className="p-2.5 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-200">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                Admin password updated successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          {/* Add New Admin Card */}
          <form
            onSubmit={handleCreateNewAdmin}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5"
          >
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#77101F]" />
              Add New Admin Account
            </h3>

            {newAdminError && (
              <div className="p-2.5 bg-red-50 text-red-800 rounded-xl text-xs font-bold border border-red-200">
                {newAdminError}
              </div>
            )}

            {newAdminSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                {newAdminSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Full Name *</label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                required
                placeholder="e.g. Vikram Reddy"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email *</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                placeholder="admin@trussets.in"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={newAdminPhone}
                onChange={(e) => setNewAdminPhone(e.target.value)}
                placeholder="+91 98480 12345"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Role</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
              >
                <option value="super_admin">Super Administrator</option>
                <option value="operations_admin">Operations Manager</option>
                <option value="deed_auditor">Deed Verification Specialist</option>
                <option value="support_staff">Customer Support Lead</option>
                <option value="content_moderator">Content &amp; Media Moderator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingAdmin}
              className="w-full py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isCreatingAdmin ? 'Creating Admin...' : 'Add New Admin'}
            </button>

            {adminsList.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Active Admins ({adminsList.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {adminsList.map((adm) => (
                    <div key={adm.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{adm.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{adm.email} • {adm.roleTitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Database & Disaster Recovery */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700" />
              Backup & Disaster Recovery
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate and download an encrypted snapshot of all properties, user deeds, transactions, and audit logs.
            </p>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Full JSON Snapshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
