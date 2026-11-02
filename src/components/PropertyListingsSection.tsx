import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  ChevronDown, 
  ShieldCheck, 
  SlidersHorizontal,
  X,
  Check,
  Building2,
  Home,
  Compass,
  MapPin
} from 'lucide-react';
import { PropertyListing, PropertyCategory, TransactionType } from '../types';
import { PropertyCard } from './PropertyCard';
import { extractCityAndPlace } from '../utils/geolocation';

interface PropertyListingsSectionProps {
  properties: PropertyListing[];
  selectedCategory: PropertyCategory;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: PropertyListing) => void;
  searchQuery: string;
  transactionType?: TransactionType;
  onOpenProperty?: (id: string) => void;
  currentCity?: string;
  onOpenCityModal?: () => void;
  onResetCity?: () => void;
}

export const PropertyListingsSection: React.FC<PropertyListingsSectionProps> = ({
  properties,
  selectedCategory,
  savedIds,
  onToggleSave,
  onSelectProperty,
  searchQuery,
  transactionType = 'buy',
  onOpenProperty,
  currentCity = 'Select Location',
  onOpenCityModal,
  onResetCity,
}) => {
  const { city: activeCityName } = extractCityAndPlace(currentCity);
  const isRent = transactionType === 'rent';
  const defaultMaxPrice = isRent ? 300000 : 100000000; // 3 Lakhs/mo for rent, 10 Cr for buy

  // Reactive Filter State (filters apply immediately upon click / change)
  const [maxPrice, setMaxPrice] = useState<number>(defaultMaxPrice);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // Empty = All types
  const [selectedFacing, setSelectedFacing] = useState<string | null>(null); // Null = Any facing
  const [selectedPossession, setSelectedPossession] = useState<string>('all'); // All statuses
  const [selectedPlace, setSelectedPlace] = useState<string>('all'); // All places / micro-markets
  const [selectedPropertyStatus, setSelectedPropertyStatus] = useState<'all' | 'NEW' | 'OLD'>('all');

  const [sortBy, setSortBy] = useState<'nearest' | 'price_low' | 'price_high' | 'newest'>('nearest');
  const [typeSearch, setTypeSearch] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available unique places from currently loaded properties
  const availablePlaces = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (p.locality) set.add(p.locality);
    });
    return Array.from(set);
  }, [properties]);

  // Sync with default limit if transactionType or currentCity changes
  useEffect(() => {
    const limit = isRent ? 300000 : 100000000;
    setMaxPrice(limit);
    setSelectedTypes([]);
    setSelectedFacing(null);
    setSelectedPossession('all');
    setSelectedPlace('all');
    setSelectedPropertyStatus('all');
  }, [transactionType, isRent, currentCity]);

  // Count active applied filters
  const activeFiltersCount = 
    (selectedTypes.length > 0 ? 1 : 0) +
    (selectedFacing !== null ? 1 : 0) +
    (selectedPossession !== 'all' ? 1 : 0) +
    (selectedPlace !== 'all' ? 1 : 0) +
    (selectedPropertyStatus !== 'all' ? 1 : 0) +
    (maxPrice < defaultMaxPrice ? 1 : 0);

  // Property types as explicitly requested by user:
  // Buy: plots/layouts, villas and houses, apartments/flats, agricultural land, commercial buildings, farmhouses
  // Rent: apartments/flats, houses/villas, commercial offices and shops, farmhouses to stay or rent, warehouses/industrial shed, commercial open yard
  const propertyTypesList = isRent
    ? [
        { id: 'apartments', label: 'Apartments / Flats' },
        { id: 'villas', label: 'Houses / Villas' },
        { id: 'commercial', label: 'Commercial Offices and Shops' },
        { id: 'farmhouses', label: 'Farmhouses to Stay or Rent' },
        { id: 'warehouses', label: 'Warehouses / Industrial Shed' },
        { id: 'commercial_yard', label: 'Commercial Open Yard' },
      ]
    : [
        { id: 'plots', label: 'Plots / Layouts' },
        { id: 'villas', label: 'Villas and Houses' },
        { id: 'apartments', label: 'Apartments / Flats' },
        { id: 'lands', label: 'Agricultural Land' },
        { id: 'commercial', label: 'Commercial Buildings' },
        { id: 'farmhouses', label: 'Farmhouses' },
      ];

  const handleToggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleResetFilters = () => {
    const limit = isRent ? 300000 : 100000000;
    setMaxPrice(limit);
    setSelectedTypes([]);
    setSelectedFacing(null);
    setSelectedPossession('all');
    setSelectedPlace('all');
    setSelectedPropertyStatus('all');
  };

  // Helper to match facing accurately
  const checkFacingMatch = (itemFacing: string, targetFacing: string): boolean => {
    const itemNorm = itemFacing.toLowerCase().replace(/[^a-z]/g, '');
    const targetNorm = targetFacing.toLowerCase().replace(/[^a-z]/g, '');

    if (targetNorm === 'northeast') {
      return itemNorm.includes('northeast') || (itemNorm.includes('north') && itemNorm.includes('east'));
    }
    if (targetNorm === 'southeast') {
      return itemNorm.includes('southeast') || (itemNorm.includes('south') && itemNorm.includes('east'));
    }
    if (targetNorm === 'northwest') {
      return itemNorm.includes('northwest') || (itemNorm.includes('north') && itemNorm.includes('west'));
    }
    if (targetNorm === 'southwest') {
      return itemNorm.includes('southwest') || (itemNorm.includes('south') && itemNorm.includes('west'));
    }

    // Pure cardinal: must NOT be compound when target is east/west/north/south
    if (targetNorm === 'east') return itemNorm.includes('east') && !itemNorm.includes('north') && !itemNorm.includes('south');
    if (targetNorm === 'west') return itemNorm.includes('west') && !itemNorm.includes('north') && !itemNorm.includes('south');
    if (targetNorm === 'north') return itemNorm.includes('north') && !itemNorm.includes('east') && !itemNorm.includes('west');
    if (targetNorm === 'south') return itemNorm.includes('south') && !itemNorm.includes('east') && !itemNorm.includes('west');

    return itemNorm.includes(targetNorm);
  };

  // Filter logic (runs immediately and reactively on every user click)
  const filteredProperties = useMemo(() => {
    return properties.filter((item) => {
      // 1. Transaction Type Check (Buy vs Rent)
      if (item.transactionType !== transactionType) return false;

      // 2. Category Tab Filter (from pill bar)
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'luxury' && item.price < (isRent ? 80000 : 25000000)) return false;
        if (selectedCategory !== 'luxury' && item.category !== selectedCategory) return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(query) ||
          item.locality.toLowerCase().includes(query) ||
          item.city.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query);
        if (!match) return false;
      }

      // 4. Max Price Filter
      if (item.price > maxPrice) return false;

      // 5. Property Types Filter
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(item.category)) {
          return false;
        }
      }

      // 6. Facing Direction Filter
      if (selectedFacing) {
        if (!checkFacingMatch(item.facing, selectedFacing)) {
          return false;
        }
      }

      // 7. Possession / Status Filter
      if (selectedPossession && selectedPossession !== 'all') {
        const statusLower = item.possessionStatus.toLowerCase();
        if (selectedPossession === 'Ready to Move In') {
          if (!statusLower.includes('ready') && !statusLower.includes('move')) return false;
        } else if (selectedPossession === 'Ready for Registration') {
          if (!statusLower.includes('registration') && !statusLower.includes('ready')) return false;
        } else if (selectedPossession === 'Under Construction') {
          if (!statusLower.includes('construction') && !statusLower.includes('202')) return false;
        }
      }

      // 8. Place-wise / Locality Filter
      if (selectedPlace && selectedPlace !== 'all') {
        if (!item.locality.toLowerCase().includes(selectedPlace.toLowerCase())) {
          return false;
        }
      }

      // 9. Property Status Filter (New vs Old)
      if (selectedPropertyStatus !== 'all') {
        if (selectedPropertyStatus === 'NEW') {
          if (item.propertyStatus !== 'NEW' && item.propertyAge !== 0 && item.propertyAgeYears !== 0) {
            return false;
          }
        } else if (selectedPropertyStatus === 'OLD') {
          if (item.propertyStatus !== 'OLD' && (item.propertyAge === 0 || item.propertyAgeYears === 0)) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0; // default nearest
    });
  }, [
    properties, 
    transactionType,
    selectedCategory, 
    searchQuery, 
    maxPrice, 
    selectedTypes, 
    selectedFacing, 
    selectedPossession, 
    selectedPlace,
    selectedPropertyStatus,
    sortBy, 
    isRent
  ]);

  // All 8 facing directions as requested by user
  const facingOptions = [
    'East',
    'West',
    'North',
    'South',
    'Northeast',
    'Southeast',
    'Northwest',
    'Southwest',
  ];

  const statusOptions = isRent
    ? [
        { id: 'all', label: 'All Statuses / Any' },
        { id: 'Ready to Move In', label: 'Immediate Move-in Available' },
        { id: 'Ready for Registration', label: '15-Day Agreement Ready' },
      ]
    : [
        { id: 'all', label: 'All Statuses / Any' },
        { id: 'Ready for Registration', label: 'Ready for Registration (Clear Title)' },
        { id: 'Ready to Move In', label: 'Ready to Move In' },
        { id: 'Under Construction', label: 'Under Construction (2025+)' },
      ];

  const formatPriceLabel = (val: number) => {
    if (isRent) {
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs/mo`;
      return `₹${val.toLocaleString()}/mo`;
    }
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Distinct Section Header based on Buy vs Rent */}
      <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border shadow-2xs">
              {isRent ? (
                <span className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-emerald-600" />
                  Direct Landlord Rentals • 0% Brokerage
                </span>
              ) : (
                <span className="bg-red-50 text-[#77101F] border-red-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#77101F]" />
                  Direct Owner Resale & New Projects • 0% Brokerage
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isRent 
                ? (activeCityName ? `Verified Properties for Rent in ${activeCityName}` : 'Verified Properties for Rent & Lease')
                : (activeCityName ? `Verified Properties for Sale in ${activeCityName}` : 'Verified Properties for Sale & Investment')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              {isRent
                ? 'Connect directly with property owners for zero-brokerage rental homes and commercial spaces with standard 11-month lease terms.'
                : 'Authenticated 30-year Encumbrance Certificates (EC) and registered Title Deeds verified before listing. 0% broker commission.'}
            </p>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-[#77101F] text-xs font-bold hover:bg-red-100 transition-colors w-fit"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Active Filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Place-wise Micro-Market Filter Bar */}
      {availablePlaces.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#77101F]" />
              <span>Browse Place-wise Localities:</span>
            </span>
            {selectedPlace !== 'all' && (
              <button
                onClick={() => setSelectedPlace('all')}
                className="text-xs font-semibold text-[#77101F] hover:underline cursor-pointer"
              >
                Show All Places
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedPlace('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlace === 'all'
                  ? 'bg-[#77101F] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Places ({properties.length})
            </button>
            {availablePlaces.map((place) => {
              const isSelected = selectedPlace.toLowerCase() === place.toLowerCase();
              const count = properties.filter((p) => p.locality.toLowerCase().includes(place.toLowerCase())).length;
              return (
                <button
                  key={place}
                  onClick={() => setSelectedPlace(isSelected ? 'all' : place)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#77101F] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{place}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile filter toggle bar */}
      <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          id="mobile-filters-trigger-btn"
          onClick={() => setIsMobileFilterOpen(true)}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#77101F]" />
          <span>Filters & Specifications</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 bg-[#77101F] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredProperties.length}</strong> properties
        </span>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {isMobileFilterOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Affordance */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#77101F]" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Filters & Specifications
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#77101F] hover:underline cursor-pointer"
                  >
                    Reset ({activeFiltersCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="overflow-y-auto p-5 space-y-6 flex-1">
              {/* Price Range Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                  <span>{isRent ? 'Max Monthly Rent' : 'Max Budget'}</span>
                  <span className="text-[#77101F] font-black">{formatPriceLabel(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min={isRent ? 10000 : 2000000}
                  max={defaultMaxPrice}
                  step={isRent ? 5000 : 200000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#77101F] cursor-pointer h-2"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>{isRent ? '₹10k/mo' : '₹20 Lakhs'}</span>
                  <span>{isRent ? '₹3 Lakhs/mo' : '₹10 Cr'}</span>
                </div>
              </div>

              {/* Property Status Filter (New vs Old) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Property Status
                  </label>
                  {selectedPropertyStatus !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedPropertyStatus('all')}
                      className="text-[10px] text-[#77101F] font-bold hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'NEW', label: 'New Property' },
                    { id: 'OLD', label: 'Old Property' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPropertyStatus(opt.id as any)}
                      className={`min-h-[40px] py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        selectedPropertyStatus === opt.id
                          ? 'bg-[#77101F] text-white border-[#77101F] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Types Filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Property Category
                  </label>
                  {selectedTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTypes([])}
                      className="text-[10px] text-[#77101F] font-bold hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {propertyTypesList.map((type) => {
                    const isChecked = selectedTypes.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 cursor-pointer select-none active:scale-98 transition-transform"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleType(type.id)}
                          className="w-4 h-4 text-[#77101F] rounded focus:ring-[#77101F] accent-[#77101F]"
                        />
                        <span className={isChecked ? 'font-bold text-slate-900' : ''}>
                          {type.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Facing Direction */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Facing Direction
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {facingOptions.map((facing) => {
                    const isSelected = selectedFacing === facing;
                    return (
                      <button
                        key={facing}
                        type="button"
                        onClick={() => setSelectedFacing(isSelected ? null : facing)}
                        className={`min-h-[44px] py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-red-50 text-[#77101F] border-[#77101F] font-bold ring-1 ring-[#77101F]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {facing}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Possession Status */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Possession / Status
                </label>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <label 
                      key={status.id} 
                      className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 cursor-pointer select-none active:scale-98"
                    >
                      <input
                        type="radio"
                        name="possessionStatusOptionMobile"
                        value={status.id}
                        checked={selectedPossession === status.id}
                        onChange={(e) => setSelectedPossession(e.target.value)}
                        className="w-4 h-4 text-[#77101F] focus:ring-[#77101F] accent-[#77101F]"
                      />
                      <span className={selectedPossession === status.id ? 'font-bold text-slate-900' : ''}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned Bottom CTA Bar */}
            <div 
              className="p-4 border-t border-slate-100 bg-white shrink-0"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
            >
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full h-12 rounded-xl bg-[#77101F] hover:bg-[#600c19] active:scale-98 text-white font-bold text-sm shadow-md flex items-center justify-center cursor-pointer transition-all"
              >
                Show {filteredProperties.length} Properties
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sidebar + Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filter Sidebar (Desktop only) */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#77101F]" />
              Filter Properties
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#77101F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Price Range Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
              <span>{isRent ? 'Max Monthly Rent' : 'Max Budget'}</span>
              <span className="text-[#77101F] font-black">{formatPriceLabel(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={isRent ? 10000 : 2000000}
              max={defaultMaxPrice}
              step={isRent ? 5000 : 200000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#77101F] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
              <span>{isRent ? '₹10k/mo' : '₹20 Lakhs'}</span>
              <span>{isRent ? '₹3 Lakhs/mo' : '₹10 Cr'}</span>
            </div>
          </div>

          {/* Property Status Filter (New vs Old) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Property Status
              </label>
              {selectedPropertyStatus !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedPropertyStatus('all')}
                  className="text-[10px] text-[#77101F] font-bold hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'NEW', label: 'New' },
                { id: 'OLD', label: 'Old' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPropertyStatus(opt.id as any)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    selectedPropertyStatus === opt.id
                      ? 'bg-[#77101F] text-white border-[#77101F] shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Property Types Filter */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Property Category
              </label>
              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setSelectedTypes([])}
                  className="text-[10px] text-[#77101F] font-bold hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search types..."
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#77101F]"
              />
            </div>
            <div className="space-y-2">
              {propertyTypesList
                .filter((t) => t.label.toLowerCase().includes(typeSearch.toLowerCase()))
                .map((type) => {
                  const isChecked = selectedTypes.includes(type.id);
                  return (
                    <label
                      key={type.id}
                      className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleType(type.id)}
                        className="rounded border-slate-300 text-[#77101F] focus:ring-[#77101F] w-4 h-4 accent-[#77101F]"
                      />
                      <span className={isChecked ? 'font-bold text-slate-900' : ''}>{type.label}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Facing Direction */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Facing Direction
              </label>
              {selectedFacing && (
                <button
                  onClick={() => setSelectedFacing(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {facingOptions.map((facing) => {
                const isSelected = selectedFacing === facing;
                return (
                  <button
                    key={facing}
                    type="button"
                    onClick={() => setSelectedFacing(isSelected ? null : facing)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 text-[#77101F] border-[#77101F] shadow-2xs font-bold ring-1 ring-[#77101F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {facing}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Possession / Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Possession / Status
              </label>
              {selectedPossession !== 'all' && (
                <button
                  onClick={() => setSelectedPossession('all')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              {statusOptions.map((status) => (
                <label key={status.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="possessionStatusOption"
                    value={status.id}
                    checked={selectedPossession === status.id}
                    onChange={(e) => setSelectedPossession(e.target.value)}
                    className="text-[#77101F] focus:ring-[#77101F] accent-[#77101F]"
                  />
                  <span className={selectedPossession === status.id ? 'font-bold text-slate-900' : ''}>
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Right Listings Column */}
        <div className="lg:col-span-3">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
            <div className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
              <span>
                Showing <strong className="text-slate-900">{filteredProperties.length}</strong> of {properties.filter(p => p.transactionType === transactionType).length} verified listings
              </span>
              {selectedFacing && (
                <span className="px-2 py-0.5 bg-red-50 text-[#77101F] rounded-full text-[10px] font-bold border border-red-200 inline-flex items-center gap-1">
                  Facing: {selectedFacing}
                  <button onClick={() => setSelectedFacing(null)} className="hover:text-red-900 cursor-pointer">×</button>
                </span>
              )}
              {selectedTypes.length > 0 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200 inline-flex items-center gap-1">
                  {selectedTypes.length} Types
                  <button onClick={() => setSelectedTypes([])} className="hover:text-slate-900 cursor-pointer">×</button>
                </span>
              )}
              {selectedPossession !== 'all' && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200 inline-flex items-center gap-1">
                  {selectedPossession}
                  <button onClick={() => setSelectedPossession('all')} className="hover:text-slate-900 cursor-pointer">×</button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-dropdown" className="text-xs text-slate-500 font-medium">Sort by:</label>
              <select
                id="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#77101F]"
              >
                <option value="nearest">Sort by location (nearest first)</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest Listed First</option>
              </select>
            </div>
          </div>

          {/* Grid of cards */}
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((property) => (
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
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {properties.length === 0 && activeCityName
                  ? `No properties listed in ${activeCityName} yet`
                  : 'No properties match your active filter criteria'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {properties.length === 0 && activeCityName
                  ? `We are currently showing only properties located in ${activeCityName}. You can switch to another city or view all cities.`
                  : 'Try clearing the facing direction, broadening property categories, or increasing the maximum price range.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 bg-[#77101F] text-white text-xs font-bold rounded-xl hover:bg-[#600c19] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
                {onOpenCityModal && (
                  <button
                    onClick={onOpenCityModal}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#77101F]" />
                    <span>Change City</span>
                  </button>
                )}
                {activeCityName && onResetCity && (
                  <button
                    onClick={onResetCity}
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Show All Cities
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
