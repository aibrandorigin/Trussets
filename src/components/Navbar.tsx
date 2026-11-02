import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  ChevronDown, 
  Heart, 
  PlusCircle, 
  Menu, 
  X, 
  Home, 
  Sparkles,
  TreePine,
  LandPlot,
  Building,
  Warehouse,
  User,
  LogIn,
  KeyRound,
  CreditCard
} from 'lucide-react';
import { TransactionType, PropertyCategory, ActivePage, UserProfile } from '../types';
import { TrussetsLogo } from './TrussetsLogo';
import { ShieldCheck, LogOut } from 'lucide-react';
import { AdminProfileModal } from './admin/AdminProfileModal';

interface NavbarProps {
  currentCity: string;
  onOpenCityModal: () => void;
  activeTransaction: TransactionType;
  onSelectTransaction: (type: TransactionType) => void;
  onSelectCategory: (category: PropertyCategory) => void;
  onOpenPostWizard: () => void;
  savedCount: number;
  onOpenSavedModal: () => void;
  onResetView: () => void;
  // Navigation & User Auth props
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  isAdminLoggedIn?: boolean;
  adminUser?: any | null;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  onOpenCityModal,
  activeTransaction,
  onSelectTransaction,
  onSelectCategory,
  onOpenPostWizard,
  savedCount,
  onOpenSavedModal,
  onResetView,
  activePage,
  onNavigate,
  user,
  onOpenLogin,
  onOpenProfile,
  isAdminLoggedIn = false,
  adminUser = null,
  onAdminLogout,
}) => {
  const [isBuyDropdownOpen, setIsBuyDropdownOpen] = useState(false);
  const [isRentDropdownOpen, setIsRentDropdownOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  
  const buyDropdownRef = useRef<HTMLDivElement>(null);
  const rentDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buyDropdownRef.current && !buyDropdownRef.current.contains(event.target as Node)) {
        setIsBuyDropdownOpen(false);
      }
      if (rentDropdownRef.current && !rentDropdownRef.current.contains(event.target as Node)) {
        setIsRentDropdownOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 w-full gap-1.5 sm:gap-4 transition-all">
          
          {/* Left: Brand Logo & City Selector */}
          <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 shrink">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="flex items-center text-left group hover:opacity-90 transition-opacity cursor-pointer shrink-0 max-w-[105px] min-[360px]:max-w-[125px] min-[420px]:max-w-[155px] sm:max-w-[190px] md:max-w-[220px]"
              aria-label="Trussets Marketplace"
            >
              <TrussetsLogo size="header" />
            </button>

            {/* City Selector Pill with GPS Icon */}
            <button
              id="navbar-city-selector-btn"
              onClick={onOpenCityModal}
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-[10px] min-[380px]:text-[11px] sm:text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 max-w-[95px] min-[360px]:max-w-[120px] min-[420px]:max-w-[150px] sm:max-w-none"
              title="Change location (city & place-wise) or detect GPS"
            >
              <MapPin className="w-3.5 h-3.5 text-[#77101F] shrink-0" />
              <span className="max-w-[45px] min-[360px]:max-w-[65px] min-[420px]:max-w-[95px] sm:max-w-[180px] truncate">
                {currentCity === 'Select Location' ? 'Location' : currentCity}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Center / Nav Items (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Home Link */}
            <button
              id="nav-home-btn"
              onClick={() => onNavigate('home')}
              className={`text-sm font-bold transition-colors cursor-pointer py-1 border-b-2 ${
                activePage === 'home'
                  ? 'text-[#77101F] border-[#77101F]'
                  : 'text-slate-700 hover:text-[#77101F] border-transparent'
              }`}
            >
              Home
            </button>

            {/* Buy Dropdown */}
            <div className="relative" ref={buyDropdownRef}>
              <div className="flex items-center">
                <button
                  id="nav-buy-btn"
                  onClick={() => onNavigate('buy')}
                  className={`text-sm font-bold transition-colors cursor-pointer py-1 border-b-2 ${
                    activePage === 'buy'
                      ? 'text-[#77101F] border-[#77101F]'
                      : 'text-slate-700 hover:text-[#77101F] border-transparent'
                  }`}
                >
                  Buy
                </button>
                <button
                  id="nav-buy-dropdown-btn"
                  onClick={() => {
                    setIsBuyDropdownOpen(!isBuyDropdownOpen);
                    setIsRentDropdownOpen(false);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer ml-0.5"
                  aria-label="Toggle Buy categories"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBuyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isBuyDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Buy by Category (0% Brokerage)
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => {
                        onSelectTransaction('buy');
                        onSelectCategory('plots');
                        onNavigate('buy');
                        setIsBuyDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#77101F] rounded-lg transition-colors text-left"
                    >
                      <LandPlot className="w-4 h-4 text-[#77101F]" />
                      Plots / Layouts
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('buy');
                        onSelectCategory('villas');
                        onNavigate('buy');
                        setIsBuyDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#77101F] rounded-lg transition-colors text-left"
                    >
                      <Home className="w-4 h-4 text-[#77101F]" />
                      Villas and Houses
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('buy');
                        onSelectCategory('apartments');
                        onNavigate('buy');
                        setIsBuyDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#77101F] rounded-lg transition-colors text-left"
                    >
                      <Building2 className="w-4 h-4 text-[#77101F]" />
                      Apartments / Flats
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('buy');
                        onSelectCategory('lands');
                        onNavigate('buy');
                        setIsBuyDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#77101F] rounded-lg transition-colors text-left"
                    >
                      <TreePine className="w-4 h-4 text-[#77101F]" />
                      Agricultural Land
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('buy');
                        onSelectCategory('commercial');
                        onNavigate('buy');
                        setIsBuyDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#77101F] rounded-lg transition-colors text-left"
                    >
                      <Building className="w-4 h-4 text-[#77101F]" />
                      Commercial Buildings
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('buy');
                        onSelectCategory('farmhouses');
                        onNavigate('buy');
                        setIsBuyDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-[#77101F] rounded-lg transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-[#77101F]" />
                      Farmhouses
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rent Dropdown */}
            <div className="relative" ref={rentDropdownRef}>
              <div className="flex items-center">
                <button
                  id="nav-rent-btn"
                  onClick={() => onNavigate('rent')}
                  className={`text-sm font-bold transition-colors cursor-pointer py-1 border-b-2 ${
                    activePage === 'rent'
                      ? 'text-emerald-700 border-emerald-700'
                      : 'text-slate-700 hover:text-emerald-700 border-transparent'
                  }`}
                >
                  Rent
                </button>
                <button
                  id="nav-rent-dropdown-btn"
                  onClick={() => {
                    setIsRentDropdownOpen(!isRentDropdownOpen);
                    setIsBuyDropdownOpen(false);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer ml-0.5"
                  aria-label="Toggle Rent categories"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isRentDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Rent Direct from Landlords
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => {
                        onSelectTransaction('rent');
                        onSelectCategory('apartments');
                        onNavigate('rent');
                        setIsRentDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                    >
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      Apartments / Flats
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('rent');
                        onSelectCategory('villas');
                        onNavigate('rent');
                        setIsRentDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                    >
                      <Home className="w-4 h-4 text-emerald-700" />
                      Houses / Villas
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('rent');
                        onSelectCategory('commercial');
                        onNavigate('rent');
                        setIsRentDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                    >
                      <Building className="w-4 h-4 text-emerald-700" />
                      Commercial Offices and Shops
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('rent');
                        onSelectCategory('farmhouses');
                        onNavigate('rent');
                        setIsRentDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      Farmhouses to Stay or Rent
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('rent');
                        onSelectCategory('warehouses');
                        onNavigate('rent');
                        setIsRentDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                    >
                      <Warehouse className="w-4 h-4 text-emerald-700" />
                      Warehouses / Industrial Shed
                    </button>
                    <button
                      onClick={() => {
                        onSelectTransaction('rent');
                        onSelectCategory('commercial_yard');
                        onNavigate('rent');
                        setIsRentDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                    >
                      <LandPlot className="w-4 h-4 text-emerald-700" />
                      Commercial Open Yard
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* Plans Nav Link */}
            <button
              id="nav-plans-btn"
              onClick={() => onNavigate('property-plans')}
              className={`text-sm font-bold transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
                activePage === 'property-plans'
                  ? 'text-[#77101F] border-[#77101F]'
                  : 'text-slate-700 hover:text-[#77101F] border-transparent'
              }`}
              title="View TrustSets Plans (Buying & Rental)"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#77101F]" />
              <span>Plans</span>
              {user?.planName && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Post Property Button (Desktop / Tablet - on mobile, use center bottom nav thumb button) */}
            <button
              id="post-property-cta-btn"
              onClick={onOpenPostWizard}
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Post Property</span>
            </button>

            {/* Wishlist Heart (visible on tablet/desktop, on mobile directly available in bottom navigation and menu) */}
            <button
              id="wishlist-btn"
              onClick={onOpenSavedModal}
              className="hidden sm:flex relative min-w-[40px] min-h-[40px] items-center justify-center p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-all active:scale-95 cursor-pointer"
              title="Saved Properties"
            >
              <Heart className={`w-5 h-5 ${savedCount > 0 ? 'fill-[#77101F] text-[#77101F]' : ''}`} />
              {savedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#77101F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Authenticated Header Logic: Admin Profile vs User Profile vs Login */}
            {isAdminLoggedIn ? (
              <button
                id="main-header-admin-profile-btn"
                onClick={onOpenProfile}
                className={`min-h-[34px] sm:min-h-[44px] flex items-center gap-1 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-full border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  activePage === 'profile'
                    ? 'border-[#77101F] bg-red-50 text-[#77101F]'
                    : 'border-amber-300 bg-amber-50 hover:bg-amber-100/70 text-slate-800'
                }`}
                title="View Profile & Admin Portal Access"
              >
                <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#77101F] to-[#540B16] text-amber-300 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : 'A')}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <span className="font-extrabold block truncate max-w-[100px] leading-tight">
                    {adminUser?.name || user?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 block leading-none">
                    Admin Profile
                  </span>
                </div>
              </button>
            ) : user ? (
              <button
                id="user-profile-btn"
                onClick={onOpenProfile}
                className={`min-h-[34px] sm:min-h-[44px] flex items-center gap-1 sm:gap-1.5 p-1 sm:pl-1 sm:pr-2.5 sm:py-1 rounded-full border transition-all active:scale-95 cursor-pointer ${
                  activePage === 'profile'
                    ? 'border-[#77101F] bg-red-50/70 text-[#77101F]'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                }`}
                title="View your profile, listings & documents"
              >
                <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#77101F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <span className="font-bold block truncate max-w-[90px]">{user.name.split(' ')[0]}</span>
                </div>
              </button>
            ) : (
              <button
                id="login-btn"
                onClick={onOpenLogin}
                className="min-h-[34px] sm:min-h-[38px] flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#77101F] text-[#77101F] hover:bg-[#77101F] hover:text-white active:scale-95 transition-all text-xs font-bold cursor-pointer shrink-0"
                title="Log In"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Log In</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center p-1 sm:p-2 text-slate-700 hover:bg-slate-100 active:scale-95 rounded-lg sm:rounded-xl cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <TrussetsLogo size="sm" />
            <span className="text-[11px] font-bold text-slate-400">0% Brokerage</span>
          </div>

          <button
            onClick={() => {
              onOpenCityModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#77101F]" />
              City: {currentCity}
            </span>
            <span className="text-xs text-[#77101F] font-bold">Change ⌄</span>
          </button>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => {
                onNavigate('home');
                setIsMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-bold text-center border ${
                activePage === 'home' ? 'bg-[#77101F] text-white border-[#77101F]' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('buy');
                setIsMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-bold text-center border ${
                activePage === 'buy' ? 'bg-[#77101F] text-white border-[#77101F]' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => {
                onNavigate('rent');
                setIsMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-bold text-center border ${
                activePage === 'rent' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              Rent
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            {isAdminLoggedIn ? (
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-slate-900 text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2 border border-amber-200 cursor-pointer"
              >
                <User className="w-4 h-4 text-[#77101F]" />
                <span>My Profile ({adminUser?.name || user?.name || 'Administrator'})</span>
              </button>
            ) : user ? (
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-900 text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2 border border-slate-200"
              >
                <User className="w-4 h-4 text-[#77101F]" />
                <span>My Profile ({user.name})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-red-50 text-[#77101F] text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2 border border-red-200"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In / Sign Up</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenPostWizard();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 bg-[#77101F] text-white text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Post Property</span>
            </button>

            <button
              onClick={() => {
                onNavigate('property-plans');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 text-sm font-bold rounded-lg text-center flex items-center justify-center gap-2 border ${
                activePage === 'property-plans'
                  ? 'bg-[#77101F] text-white border-[#77101F]'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#77101F]" />
              <span>Plans</span>
              {user?.planName && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onOpenSavedModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 bg-white text-slate-800 text-sm font-bold rounded-lg text-center flex items-center justify-between border border-slate-200 cursor-pointer active:scale-98 transition-all"
            >
              <span className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${savedCount > 0 ? 'fill-[#77101F] text-[#77101F]' : 'text-slate-600'}`} />
                <span>Saved Properties</span>
              </span>
              {savedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#77101F] text-white">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Admin Profile Details Modal */}
      <AdminProfileModal
        isOpen={isAdminProfileModalOpen}
        onClose={() => setIsAdminProfileModalOpen(false)}
        admin={adminUser}
        onNavigateWorkspace={() => onNavigate('admin')}
        onLogout={onAdminLogout}
        isInWorkspace={activePage === 'admin'}
      />
    </header>
  );
};
