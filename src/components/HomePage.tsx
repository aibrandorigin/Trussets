import React from 'react';
import { 
  Building2, 
  Home, 
  MapPin, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  TrendingUp, 
  LandPlot, 
  TreePine, 
  Building, 
  Sparkles, 
  Percent, 
  Compass,
  FileCheck
} from 'lucide-react';
import { PropertyListing, PropertyCategory, TransactionType } from '../types';
import { PropertyCard } from './PropertyCard';
import { TrussetsLogo } from './TrussetsLogo';
import { POPULAR_CITIES } from '../data/citiesData';
import { extractCityAndPlace } from '../utils/geolocation';

interface HomePageProps {
  currentCity: string;
  onOpenCityModal: () => void;
  onResetCity?: () => void;
  onNavigate: (page: 'home' | 'buy' | 'rent') => void;
  onSelectCategory: (cat: PropertyCategory) => void;
  onOpenPostWizard: () => void;
  buyProperties: PropertyListing[];
  rentProperties: PropertyListing[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: PropertyListing) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onDetectGps: () => void;
  isLocating: boolean;
  onOpenProperty?: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentCity,
  onOpenCityModal,
  onResetCity,
  onNavigate,
  onSelectCategory,
  onOpenPostWizard,
  buyProperties,
  rentProperties,
  savedIds,
  onToggleSave,
  onSelectProperty,
  searchQuery,
  onSearchChange,
  onDetectGps,
  isLocating,
  onOpenProperty,
}) => {
  const { city: activeCityName } = extractCityAndPlace(currentCity);
  const featuredBuy = buyProperties.slice(0, 3);
  const featuredRent = rentProperties.slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('buy');
    const el = document.getElementById('listings-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#600C18] via-[#77101F] to-[#540B16] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-amber-400 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Tag & City GPS Indicator */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-red-100 mb-6 shadow-sm">
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-amber-300" />
              <span>0% Brokerage Marketplace</span>
            </span>
            <span className="text-white/40">•</span>
            <button
              onClick={onOpenCityModal}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentCity}</span>
              <span className="text-[11px] underline opacity-80">Change</span>
            </button>
            <button
              onClick={onDetectGps}
              disabled={isLocating}
              className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors"
              title="Detect GPS location"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-300' : 'text-white'}`} />
            </button>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Direct Owner Real Estate. <br className="hidden sm:inline" />
            <span className="text-amber-300 underline decoration-amber-400/60 decoration-wavy decoration-2">
              Zero Brokerage.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-red-100/90 mt-4 max-w-2xl mx-auto leading-relaxed font-normal">
            Buy, rent, or sell verified properties across India with direct owner-to-buyer contact,
            authenticated 30-year Encumbrance Certificates (EC), and zero middleman fees.
          </p>

          {/* Quick Transaction Action Hub */}
          <div className="mt-8 max-w-2xl mx-auto bg-white rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-white/20 text-slate-800">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
              <button
                id="hero-tab-buy"
                onClick={() => onNavigate('buy')}
                className="py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-red-50 text-[#77101F] border border-[#77101F]/30 hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Building2 className="w-4 h-4 text-[#77101F]" />
                <span>Buy Properties</span>
              </button>
              <button
                id="hero-tab-rent"
                onClick={() => onNavigate('rent')}
                className="py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Home className="w-4 h-4 text-emerald-700" />
                <span>Rent Properties</span>
              </button>
              <button
                id="hero-tab-post"
                onClick={onOpenPostWizard}
                className="py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-[#77101F] hover:bg-[#600c19] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>Post Properties</span>
              </button>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Search in ${currentCity} (e.g. Kokapet, Gachibowli, 3 BHK, Villa, Plot)...`}
                className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#77101F]"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Place-wise Micro-Markets for current city */}
            {(() => {
              const matchedCity = POPULAR_CITIES.find(c => currentCity.toLowerCase().includes(c.name.toLowerCase())) || POPULAR_CITIES[0];
              const popularPlaces = matchedCity.places?.slice(0, 6) || ['Kokapet', 'Financial District', 'Gachibowli', 'Hitec City', 'Jubilee Hills', 'Mokila'];
              return (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-left">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#77101F]" />
                    Places in {matchedCity.name}:
                  </span>
                  {popularPlaces.map((place) => (
                    <button
                      key={place}
                      type="button"
                      onClick={() => {
                        onSearchChange(place);
                        onNavigate('buy');
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-red-50 hover:text-[#77101F] text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {place}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onOpenCityModal}
                    className="text-[11px] text-[#77101F] font-bold hover:underline ml-1 cursor-pointer"
                  >
                    View All Places ⌄
                  </button>
                </div>
              );
            })()}
          </div>

          {/* 3 Core Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">0% Brokerage Guarantee</h4>
                <p className="text-[11px] text-red-100/70">Never pay commissions to agents</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Verified 30-Year Title Deeds</h4>
                <p className="text-[11px] text-red-100/70">EC & legal clearance before tokens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <FileCheck className="w-5 h-5 text-blue-300 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Direct Owner Contacts</h4>
                <p className="text-[11px] text-red-100/70">Call or WhatsApp genuine landlords</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP SECTION: Explore Property Catalog (Brought to top as requested) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 pb-3 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 mb-1.5">
              <Compass className="w-3.5 h-3.5 text-[#77101F]" />
              <span>Explore Catalog</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Explore Property Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Choose a verified property category to browse direct owner listings in {currentCity}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { id: 'plots', label: 'Plots / Layouts', icon: LandPlot, count: '100% HMDA / DTCP' },
            { id: 'villas', label: 'Villas & Houses', icon: Home, count: 'Gated & Independent' },
            { id: 'apartments', label: 'Apartments / Flats', icon: Building2, count: 'High-Rise & Gated' },
            { id: 'lands', label: 'Agricultural Land', icon: TreePine, count: 'Acres & Pattadar Passbook' },
            { id: 'commercial', label: 'Commercial Buildings', icon: Building, count: 'Offices & Showrooms' },
            { id: 'farmhouses', label: 'Farmhouses', icon: Sparkles, count: 'Stay & Buy Estates' },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id as any);
                  onNavigate('buy');
                }}
                className="p-4 rounded-2xl bg-white hover:bg-red-50/50 border border-slate-200 hover:border-[#77101F] transition-all text-center group cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-red-100/60 text-slate-700 group-hover:text-[#77101F] flex items-center justify-center mx-auto mb-2.5 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#77101F] transition-colors">
                  {cat.label}
                </h4>
                <span className="text-[10px] text-slate-400 block mt-0.5">{cat.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 1: Featured Properties for SALE (Buy) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-50 text-[#77101F] border border-red-200 mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>For Sale (Buy){activeCityName ? ` • ${activeCityName}` : ''}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeCityName ? `Featured Properties for Sale in ${activeCityName}` : 'Featured Properties for Sale'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verified villas, plots, apartments, and lands for outright purchase with 0% brokerage.
            </p>
          </div>
          <button
            onClick={() => onNavigate('buy')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer w-fit"
          >
            <span>Explore All Buy Properties</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {featuredBuy.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBuy.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isSaved={savedIds.includes(property.id)}
                onToggleSave={onToggleSave}
                onSelectProperty={onSelectProperty}
                onQuickView={onSelectProperty}
                onOpenProperty={onOpenProperty}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
            <MapPin className="w-10 h-10 text-[#77101F] mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900">
              No properties for sale found in {activeCityName || currentCity} yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Only verified properties located in {activeCityName || currentCity} are displayed. You can post a property in {activeCityName || currentCity} or change your location.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onOpenCityModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Change City
              </button>
              {onResetCity && (
                <button
                  type="button"
                  onClick={onResetCity}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Show All Cities
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPostWizard}
                className="px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Post Property in {activeCityName || currentCity}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Featured Properties for RENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-3 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1.5">
              <Home className="w-3.5 h-3.5" />
              <span>For Rent{activeCityName ? ` • ${activeCityName}` : ''}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeCityName ? `Verified Homes & Spaces for Rent in ${activeCityName}` : 'Verified Homes & Spaces for Rent'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Direct landlord rentals with transparent security deposits, zero brokerage, and standard 11-month lease terms.
            </p>
          </div>
          <button
            onClick={() => onNavigate('rent')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer w-fit"
          >
            <span>Explore All Rent Properties</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {featuredRent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRent.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isSaved={savedIds.includes(property.id)}
                onToggleSave={onToggleSave}
                onSelectProperty={onSelectProperty}
                onQuickView={onSelectProperty}
                onOpenProperty={onOpenProperty}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
            <MapPin className="w-10 h-10 text-emerald-700 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900">
              No rental properties found in {activeCityName || currentCity} yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Only verified rental properties located in {activeCityName || currentCity} are displayed. You can post a rental property or change your location.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onOpenCityModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Change City
              </button>
              {onResetCity && (
                <button
                  type="button"
                  onClick={onResetCity}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Show All Cities
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPostWizard}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Post Rental in {activeCityName || currentCity}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Clear Differentiation: Buy vs Rent vs Post */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Zero Middlemen</span>
            <h3 className="text-2xl sm:text-3xl font-black mt-1 text-white">
              How Trussets Empowers Buyers, Tenants & Owners
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Say goodbye to unverified brokers, duplicate listings, and high commission charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Buy */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center mb-4 border border-red-500/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Looking to Buy Property?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Browse clear-title residential plots, gated villas, and luxury apartments. We authenticate Sub-Registration Office (SRO) details and 30-year Encumbrance Certificates.
                </p>
              </div>
              <button
                onClick={() => onNavigate('buy')}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
              >
                <span>Browse Buy Listings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Rent */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4 border border-emerald-500/30">
                  <Home className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Looking to Rent a Home?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Find fully furnished and semi-furnished apartments and villas with genuine landlords. Save 1 to 2 months rent in brokerage with transparent society maintenance.
                </p>
              </div>
              <button
                onClick={() => onNavigate('rent')}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <span>Browse Rent Listings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Post */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-4 border border-blue-500/30">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Are You a Property Owner?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  List your flat, plot, or villa in 6 simple steps. Get verified badge and connect directly with serious buyers and tenants via direct call and WhatsApp.
                </p>
              </div>
              <button
                onClick={onOpenPostWizard}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-blue-200 transition-colors"
              >
                <span>Post Your Property (Free)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
