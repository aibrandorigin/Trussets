import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_PROPERTIES } from './data/mockProperties';
import { PropertyListing, PropertyCategory, TransactionType, ActivePage, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { PropertyListingsSection } from './components/PropertyListingsSection';
import { PostPropertyWizard } from './components/PostPropertyWizard';
import { CitySelectorModal } from './components/CitySelectorModal';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { SavedPropertiesModal } from './components/SavedPropertiesModal';
import { LoginModal } from './components/LoginModal';
import { ProfilePage } from './components/ProfilePage';
import { PropertyDetailPage } from './components/PropertyDetailPage';
import { PropertyPlansPage } from './components/PropertyPlansPage';
import { AdminPage } from './components/AdminPage';
import { LegalPage } from './components/LegalPage';
import { Footer } from './components/Footer';
import { TrussetsLogo } from './components/TrussetsLogo';
import { MobileBottomNav } from './components/MobileBottomNav';
import { detectUserLocation, checkLocationPermission, filterPropertiesByCity } from './utils/geolocation';
import { propertyAccessService } from './services/propertyAccessService';
import { userService, onUserSync } from './services/userService';
import { adminApi, adminAuthStorage } from './services/adminApi';
import { brandService } from './services/brandService';
import { registerAndroidBackButton, subscribeNetworkStatus } from './utils/capacitorBridge';
import { Building2, Home, MapPin, Compass, RotateCcw, WifiOff } from 'lucide-react';

export default function App() {
  // Master State
  const [properties, setProperties] = useState<PropertyListing[]>(INITIAL_PROPERTIES);
  const [currentCity, setCurrentCity] = useState<string>('Select Location');
  const [activeTransaction, setActiveTransaction] = useState<TransactionType>('buy');
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Standalone property view ID (when navigating in the same tab with ?property=prop-id)
  const getPropertyIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('property') || params.get('id');
      if (id) return id;
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);
        const fromHash = hashParams.get('property') || hashParams.get('id');
        if (fromHash) return fromHash;
        if (hash.startsWith('property/')) return hash.replace('property/', '');
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const getActivePageFromUrl = (): ActivePage => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('page');

      if (tabParam === 'property-plans' || tabParam === 'plans' || pathname.startsWith('/property-plans')) {
        return 'property-plans';
      }
      if (tabParam === 'profile' || pathname.startsWith('/profile')) {
        return 'profile';
      }
      if (tabParam === 'buy' || pathname.startsWith('/buy')) {
        return 'buy';
      }
      if (tabParam === 'rent' || pathname.startsWith('/rent')) {
        return 'rent';
      }
      if (tabParam === 'terms' || pathname.startsWith('/terms')) {
        return 'terms';
      }
      if (tabParam === 'privacy' || pathname.startsWith('/privacy')) {
        return 'privacy';
      }
      if (tabParam === 'about' || pathname.startsWith('/about')) {
        return 'about';
      }
      if (tabParam === 'help' || pathname.startsWith('/help')) {
        return 'help';
      }
      if (tabParam === 'admin' || pathname.startsWith('/admin') || hash.startsWith('#admin') || hash.startsWith('#/admin')) {
        return 'admin';
      }
    }
    return 'home';
  };

  const [activePage, setActivePage] = useState<ActivePage>(() => getActivePageFromUrl());
  const [standalonePropertyId, setStandalonePropertyId] = useState<string | null>(() => getPropertyIdFromUrl());

  // Plan navigation parameters (Requirement 8)
  const [plansInitialType, setPlansInitialType] = useState<'Buying' | 'Rental'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type')?.toLowerCase();
      if (type === 'rental' || type === 'rent') return 'Rental';
    }
    return 'Buying';
  });

  const [plansReturnPropertyId, setPlansReturnPropertyId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('returnToProp') || null;
    }
    return null;
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('trussets_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // User Auth State - Single Source of Truth on Server (Requirement 7, 10, 11, 12, 16)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('trussets_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(true);

  // Sync user state changes to localStorage cache
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('trussets_user', JSON.stringify(user));
        localStorage.setItem('trussets_user_id', user.id);
      } else {
        localStorage.removeItem('trussets_user');
        localStorage.removeItem('trussets_user_id');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Modals & Wizards
  const [isPostWizardOpen, setIsPostWizardOpen] = useState<boolean>(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('trussets_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage in sync with wishlist
  useEffect(() => {
    try {
      localStorage.setItem('trussets_wishlist', JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedIds]);

  // Load properties from backend with public sanitization & access check
  const fetchBackendProperties = async () => {
    try {
      const url = user?.id ? `/api/properties?userId=${encodeURIComponent(user.id)}` : '/api/properties';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties) && data.properties.length > 0) {
          setProperties(data.properties);
        }
      }
    } catch (e) {
      console.warn('Backend fetch failed, using built-in properties:', e);
    }
  };

  // Requirement 11, 12, 16: Centralized Authoritative Session Validation against Backend
  const validateAndSyncSession = async () => {
    // 1. Validate Admin Session
    if (adminAuthStorage.isAuthenticated()) {
      try {
        const meRes = await adminApi.getMe();
        if (meRes?.admin) {
          setAdminUser(meRes.admin);
          setIsAdminLoggedIn(true);
        }
      } catch {
        adminAuthStorage.clear();
        setAdminUser(null);
        setIsAdminLoggedIn(false);
      }
    } else {
      setAdminUser(null);
      setIsAdminLoggedIn(false);
    }

    // 2. Validate User Session from Authoritative Server
    try {
      const userRes = await userService.fetchCurrentUser();
      if (userRes?.user) {
        setUser(userRes.user);
        if (Array.isArray(userRes.user.savedPropertyIds)) {
          setSavedIds(userRes.user.savedPropertyIds);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('User session sync check failed:', e);
    }

    // 3. Sync properties & site settings
    fetchBackendProperties();
    brandService.syncWithServer();
  };

  // On Mount and Cross-Browser / Focus Synchronization
  useEffect(() => {
    validateAndSyncSession();

    // Cross-Tab and Multi-Browser Focus / Visibility Synchronization
    const handleFocus = () => {
      validateAndSyncSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateAndSyncSession();
      }
    };

    // BroadcastChannel sync across tabs in same browser
    const unsubscribeSync = onUserSync((action) => {
      if (action === 'LOGOUT') {
        setUser(null);
        setIsAdminLoggedIn(false);
        setAdminUser(null);
        return;
      }
      validateAndSyncSession();
    });

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeSync();
    };
  }, []);

  const handleAdminLogout = () => {
    // Synchronously clear all tokens & user/admin state on first click
    adminApi.logout().catch(() => {});
    userService.logout();
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    setUser(null);
    handleNavigate('home');
  };

  // URL state listener for popstate & hashchange (Requirement 1: in-tab browser navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const propId = getPropertyIdFromUrl();
      setStandalonePropertyId(propId);

      const page = getActivePageFromUrl();
      setActivePage(page);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type')?.toLowerCase();
        if (type === 'rental' || type === 'rent') {
          setPlansInitialType('Rental');
        } else if (type === 'buying' || type === 'buy') {
          setPlansInitialType('Buying');
        }
        setPlansReturnPropertyId(params.get('returnToProp') || null);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const standaloneProperty = useMemo(() => {
    if (!standalonePropertyId) return null;
    return properties.find((p) => p.id === standalonePropertyId) || null;
  }, [standalonePropertyId, properties]);

  // Requirement 1: Open Property Cards in the SAME TAB
  const handleOpenProperty = (propertyId: string) => {
    setStandalonePropertyId(propertyId);
    setSelectedProperty(null); // close quick view modal if open
    setIsSavedModalOpen(false); // close saved modal if open

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('property', propertyId);
      url.searchParams.delete('tab');
      url.searchParams.delete('page');
      url.searchParams.delete('returnToProp');
      window.history.pushState({}, '', url.pathname + url.search);
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearPropertyUrl = () => {
    setStandalonePropertyId(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('property');
      url.searchParams.delete('id');
      url.hash = '';
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch (e) {
      console.error(e);
    }
  };

  // Requirement 8: Redirect to the specific plan section (/property-plans?type=buying or type=rental)
  const handleNavigateToPlans = (type: 'buying' | 'rental', propertyId?: string) => {
    const resolvedType = type === 'rental' ? 'Rental' : 'Buying';
    setPlansInitialType(resolvedType);
    if (propertyId) {
      setPlansReturnPropertyId(propertyId);
    }
    setStandalonePropertyId(null);
    setActivePage('property-plans');

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'property-plans');
      url.searchParams.set('type', type);
      if (propertyId) {
        url.searchParams.set('returnToProp', propertyId);
      }
      url.searchParams.delete('property');
      window.history.pushState({}, '', url.pathname + url.search);
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1) GPS Tracking: Check permission state on mount; only auto-detect if already granted
  useEffect(() => {
    checkLocationPermission().then((status) => {
      if (status === 'granted') {
        handleDetectGpsLocation();
      } else {
        setCurrentCity('Select Location');
      }
    });
  }, []);

  const handleDetectGpsLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await detectUserLocation();
      const detectedCity = loc.city && loc.city !== 'Current Location'
        ? loc.city
        : (loc.displayName || loc.locality || 'Select Location');
      setCurrentCity(detectedCity);
    } catch {
      // Do NOT force an incorrect default location like Hyderabad (Requirement 1 & 4)
      setCurrentCity('Select Location');
    } finally {
      setIsLocating(false);
    }
  };

  // Toggle Save / Wishlist with server-authoritative sync (Requirement 19)
  const handleToggleSave = async (id: string) => {
    if (user?.id) {
      try {
        const updated = await userService.toggleWishlist(user.id, id);
        setSavedIds(updated);
        setUser((prev) => prev ? { ...prev, savedPropertyIds: updated } : null);
        return;
      } catch (e) {
        console.error('Failed to sync wishlist to backend:', e);
      }
    }
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSaved = () => {
    setSavedIds([]);
  };

  const handleRemoveSaved = (id: string) => {
    setSavedIds((prev) => prev.filter((item) => item !== id));
  };

  // Add or update property from wizard
  const handleListingCreated = (newListing: PropertyListing) => {
    setProperties((prev) => {
      const idx = prev.findIndex((p) => p.id === newListing.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newListing;
        return copy;
      }
      return [newListing, ...prev];
    });
    // Also if user is logged in, attach to user listed properties
    if (user) {
      setUser((prev) => {
        if (!prev) return null;
        const currentList = prev.listedProperties || [];
        const idx = currentList.findIndex((p) => p.id === newListing.id);
        const updatedList = idx !== -1
          ? currentList.map((p) => (p.id === newListing.id ? newListing : p))
          : [newListing, ...currentList];
        return {
          ...prev,
          propertiesCount: updatedList.length,
          listedProperties: updatedList,
        };
      });
    }
  };

  // Saved properties list
  const savedProperties = useMemo(() => {
    return properties.filter((p) => savedIds.includes(p.id));
  }, [properties, savedIds]);

  // Filter properties by the detected or selected city (when a city is active)
  const cityFilteredProperties = useMemo(() => {
    return filterPropertiesByCity(properties, currentCity);
  }, [properties, currentCity]);

  const buyProperties = useMemo(() => {
    return cityFilteredProperties.filter((p) => p.transactionType === 'buy');
  }, [cityFilteredProperties]);

  const rentProperties = useMemo(() => {
    return cityFilteredProperties.filter((p) => p.transactionType === 'rent');
  }, [cityFilteredProperties]);

  // Navigation handlers
  const handleNavigate = (page: ActivePage) => {
    clearPropertyUrl();
    setActivePage(page);
    setIsPostWizardOpen(false);
    if (page === 'buy') {
      setActiveTransaction('buy');
    } else if (page === 'rent') {
      setActiveTransaction('rent');
    }

    try {
      const url = new URL(window.location.href);
      if (page === 'admin') {
        if (!url.pathname.toLowerCase().startsWith('/admin')) {
          url.pathname = '/admin';
        }
        url.searchParams.delete('tab');
        url.searchParams.delete('page');
        url.searchParams.delete('type');
      } else {
        if (url.pathname.toLowerCase().startsWith('/admin')) {
          url.pathname = '/';
        }
        if (url.hash.toLowerCase().includes('admin')) {
          url.hash = '';
        }
        if (page === 'home') {
          url.searchParams.delete('tab');
          url.searchParams.delete('page');
          url.searchParams.delete('type');
        } else {
          url.searchParams.set('tab', page);
        }
      }
      url.searchParams.delete('property');
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : ''));
    } catch (e) {
      console.error(e);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetView = () => {
    clearPropertyUrl();
    setIsPostWizardOpen(false);
    setActivePage('home');
    setSelectedCategory('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Subscribe to network online/offline status
  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus((connected) => {
      setIsNetworkOnline(connected);
      if (connected) {
        fetchBackendProperties();
      }
    });
    return unsubscribe;
  }, []);

  // Register Android hardware back button behavior
  useEffect(() => {
    const unregister = registerAndroidBackButton(() => {
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
        return true;
      }
      if (isSavedModalOpen) {
        setIsSavedModalOpen(false);
        return true;
      }
      if (isCityModalOpen) {
        setIsCityModalOpen(false);
        return true;
      }
      if (selectedProperty) {
        setSelectedProperty(null);
        return true;
      }
      if (isPostWizardOpen) {
        setIsPostWizardOpen(false);
        return true;
      }
      if (standalonePropertyId) {
        clearPropertyUrl();
        return true;
      }
      if (activePage !== 'home') {
        handleNavigate('home');
        return true;
      }
      return false;
    });
    return unregister;
  }, [
    isLoginModalOpen,
    isSavedModalOpen,
    isCityModalOpen,
    selectedProperty,
    isPostWizardOpen,
    standalonePropertyId,
    activePage,
  ]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E293B] flex flex-col font-sans selection:bg-red-100 selection:text-[#77101F] w-full max-w-full overflow-x-hidden">
      {/* Network Offline Banner for Mobile/Android */}
      {!isNetworkOnline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>You are currently offline. Reconnect to sync live properties and account updates.</span>
        </div>
      )}
      {/* Top Navbar */}
      <Navbar
        currentCity={currentCity}
        onOpenCityModal={() => setIsCityModalOpen(true)}
        activeTransaction={activeTransaction}
        onSelectTransaction={(tx) => {
          setActiveTransaction(tx);
          setActivePage(tx);
          setIsPostWizardOpen(false);
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActivePage('buy');
          setIsPostWizardOpen(false);
        }}
        onOpenPostWizard={() => {
          setIsPostWizardOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedCount={savedIds.length}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onResetView={handleResetView}
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenProfile={() => handleNavigate('profile')}
        isAdminLoggedIn={isAdminLoggedIn}
        adminUser={adminUser}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main View Modes */}
      <main className="flex-1 pb-18 lg:pb-0">
        {standaloneProperty ? (
          /* Requirement 2, 3, 4, 5, 11, 15: Property Details Page (Opens in SAME TAB) */
          <PropertyDetailPage
            property={standaloneProperty}
            allProperties={properties}
            onBackToListings={clearPropertyUrl}
            isSaved={savedIds.includes(standaloneProperty.id)}
            onToggleSave={handleToggleSave}
            onQuickView={(prop) => setSelectedProperty(prop)}
            user={user}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onNavigateToPlans={handleNavigateToPlans}
            onOpenProperty={handleOpenProperty}
          />
        ) : standalonePropertyId && !standaloneProperty ? (
          <div className="max-w-xl mx-auto px-4 py-20 text-center">
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-900">Property Not Found</h2>
              <p className="text-xs text-slate-500 mt-1.5 mb-6">
                The requested property listing may have expired, been sold, or the link is invalid.
              </p>
              <button
                onClick={clearPropertyUrl}
                className="px-6 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Browse All Properties
              </button>
            </div>
          </div>
        ) : isPostWizardOpen ? (
          <PostPropertyWizard
            currentCity={currentCity === 'Select Location' ? '' : currentCity}
            initialTransactionType={activeTransaction}
            user={user}
            onListingCreated={handleListingCreated}
            onCancel={() => setIsPostWizardOpen(false)}
          />
        ) : activePage === 'admin' ? (
          <AdminPage
            properties={properties}
            onUpdateProperty={(updated) => {
              setProperties((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            }}
            onDeleteProperty={(id) => {
              setProperties((prev) => prev.filter((p) => p.id !== id));
            }}
            onAddProperty={(newProp) => {
              setProperties((prev) => [newProp, ...prev]);
            }}
            onBackToHome={() => handleNavigate('home')}
            onOpenProfile={() => handleNavigate('profile')}
            onLogout={handleAdminLogout}
            onSelectProperty={setSelectedProperty}
            onAuthChange={(isAuth) => {
              setIsAdminLoggedIn(isAuth);
              if (isAuth) {
                adminApi.getMe().then(res => setAdminUser(res.admin)).catch(() => {});
              } else {
                setAdminUser(null);
              }
            }}
          />
        ) : activePage === 'profile' ? (
          <ProfilePage
            user={user}
            isAdminLoggedIn={isAdminLoggedIn}
            adminUser={adminUser}
            onNavigateToAdmin={() => handleNavigate('admin')}
            onNavigateToPlans={() => handleNavigate('property-plans')}
            properties={properties}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleAdminLogout}
            onUpdateUser={(updated) => {
              setUser(updated);
              if (isAdminLoggedIn) {
                setAdminUser((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        name: updated.name,
                        email: updated.email,
                        phone: updated.phone,
                      }
                    : prev
                );
              }
            }}
            onDeleteListing={(id) => {
              setProperties((prev) => prev.filter((p) => p.id !== id));
            }}
            onSelectProperty={setSelectedProperty}
            onOpenPostWizard={() => {
              setIsPostWizardOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activePage === 'property-plans' ? (
          /* Requirement 8, 9, 10, 12: Unified Property Plans Page (Buying Plans | Rental Plans) */
          <PropertyPlansPage
            initialPlanType={plansInitialType}
            returnPropertyId={plansReturnPropertyId}
            allProperties={properties}
            user={user}
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              fetchBackendProperties();
            }}
            onReturnToProperty={(propId) => handleOpenProperty(propId)}
            onBackToHome={() => handleNavigate('home')}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        ) : activePage === 'terms' || activePage === 'privacy' || activePage === 'about' || activePage === 'help' ? (
          <LegalPage
            activeTab={activePage}
            onChangeTab={(tab) => handleNavigate(tab)}
            onBackToHome={() => handleNavigate('home')}
          />
        ) : activePage === 'home' ? (
          /* Default HOME PAGE view (Requirement 1: Cards open in SAME TAB) */
          <HomePage
            currentCity={currentCity}
            onOpenCityModal={() => setIsCityModalOpen(true)}
            onResetCity={() => setCurrentCity('All Cities')}
            onNavigate={(page) => handleNavigate(page)}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              handleNavigate('buy');
            }}
            onOpenPostWizard={() => {
              setIsPostWizardOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            buyProperties={buyProperties}
            rentProperties={rentProperties}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectProperty={setSelectedProperty}
            onOpenProperty={handleOpenProperty}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onDetectGps={handleDetectGpsLocation}
            isLocating={isLocating}
          />
        ) : (
          /* DEDICATED BUY OR RENT PAGE */
          <div>
            {/* Page Sub-Header clearly differentiating Buy vs Rent */}
            <div className={`py-8 px-4 sm:px-6 lg:px-8 text-white ${
              activePage === 'rent'
                ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950'
                : 'bg-gradient-to-r from-[#600C18] via-[#77101F] to-[#540B16]'
            }`}>
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-xs mb-2 border border-white/20">
                    {activePage === 'rent' ? (
                      <span className="flex items-center gap-1 text-emerald-200">
                        <Home className="w-3.5 h-3.5" />
                        Rent Properties • Zero Brokerage
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-200">
                        <Building2 className="w-3.5 h-3.5" />
                        Buy Properties • Direct Owner Resale & Plots
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                    {activePage === 'rent' 
                      ? `Rental Properties in ${currentCity}` 
                      : `Properties for Sale in ${currentCity}`}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl">
                    {activePage === 'rent'
                      ? 'Rent verified apartments, villas, and office spaces directly from owners with zero broker fees.'
                      : 'Buy verified residential plots, luxury villas, and high-rise apartments with 30-year clear title deeds.'}
                  </p>
                </div>

                {/* Quick Toggle between Buy and Rent */}
                <div className="flex items-center bg-black/30 p-1 rounded-xl backdrop-blur-md border border-white/10 w-fit shrink-0">
                  <button
                    id="toggle-page-buy"
                    onClick={() => handleNavigate('buy')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activePage === 'buy'
                        ? 'bg-white text-[#77101F] shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Buy View
                  </button>
                  <button
                    id="toggle-page-rent"
                    onClick={() => handleNavigate('rent')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activePage === 'rent'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Rent View
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Pills Bar */}
            <CategoryFilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Property Listings & Filter Sidebar Section (Requirement 1: Cards open in SAME TAB) */}
            <div id="listings-container">
              <PropertyListingsSection
                properties={activePage === 'rent' ? rentProperties : buyProperties}
                selectedCategory={selectedCategory}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onSelectProperty={setSelectedProperty}
                onOpenProperty={handleOpenProperty}
                searchQuery={searchQuery}
                transactionType={activePage === 'rent' ? 'rent' : 'buy'}
                currentCity={currentCity}
                onOpenCityModal={() => setIsCityModalOpen(true)}
                onResetCity={() => setCurrentCity('All Cities')}
              />
            </div>
          </div>
        )}

        {/* Bottom "Post your property easily" CTA section */}
        {!isPostWizardOpen && activePage !== 'profile' && activePage !== 'admin' && activePage !== 'property-plans' && activePage !== 'terms' && activePage !== 'privacy' && activePage !== 'about' && activePage !== 'help' && !standaloneProperty && (
          <section className="bg-slate-100/70 border-t border-slate-200/80 py-12">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-2.5 px-5 bg-white rounded-2xl border border-slate-200 shadow-sm inline-flex">
                  <TrussetsLogo size="md" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Post your property easily on TrustSets
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xl mx-auto mb-6">
                List your property for Sale or Rent with verified direct inquiries and zero brokerage.
                Clean, un-crowded listing wizard with transparent document uploads.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setActiveTransaction('buy');
                    setIsPostWizardOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#77101F] hover:bg-[#600c19] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  Sell Property (0% Brokerage)
                </button>
                <button
                  onClick={() => {
                    setActiveTransaction('rent');
                    setIsPostWizardOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  Rent Property (0% Brokerage)
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigate('buy');
        }}
        onSelectTransaction={(tx) => {
          handleNavigate(tx);
        }}
        onNavigatePage={(page) => handleNavigate(page)}
        isAdminLoggedIn={isAdminLoggedIn}
        onNavigateAdmin={() => handleNavigate('admin')}
      />

      {/* Mobile Bottom Navigation Anchor (Natural Thumb Zone) */}
      {!standaloneProperty && !isPostWizardOpen && (
        <MobileBottomNav
          activePage={activePage}
          onNavigate={handleNavigate}
          savedCount={savedIds.length}
          onOpenSavedModal={() => setIsSavedModalOpen(true)}
          onOpenPostWizard={() => {
            setIsPostWizardOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={user}
          onOpenProfile={() => handleNavigate('profile')}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />
      )}

      {/* Modals */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={currentCity}
        onSelectCity={(city) => setCurrentCity(city)}
      />

      {/* Quick View Modal (Requirement 1: Opens in SAME TAB on click "View Full Page") */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isSaved={selectedProperty ? savedIds.includes(selectedProperty.id) : false}
        onToggleSave={handleToggleSave}
        onOpenProperty={handleOpenProperty}
      />

      {/* Saved Properties Modal (Requirement 1: Opens in SAME TAB) */}
      <SavedPropertiesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedProperties={savedProperties}
        onSelectProperty={setSelectedProperty}
        onRemoveSaved={handleRemoveSaved}
        onClearAll={handleClearSaved}
        onOpenProperty={handleOpenProperty}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentCity={currentCity === 'Select Location' ? '' : currentCity}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsLoginModalOpen(false);
          if (adminAuthStorage.isAuthenticated()) {
            setIsAdminLoggedIn(true);
            adminApi.getMe().then((res) => setAdminUser(res.admin)).catch(() => {});
          }
          fetchBackendProperties();
        }}
        onNavigateToAdmin={() => {
          setIsLoginModalOpen(false);
          handleNavigate('admin');
        }}
      />
    </div>
  );
}
