import React from 'react';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Ruler, 
  Compass, 
  Maximize2, 
  ShieldCheck, 
  CheckCircle2, 
  Check, 
  Eye, 
  ChevronRight,
  Lock
} from 'lucide-react';
import { PropertyListing } from '../types';

interface PropertyCardProps {
  property: PropertyListing;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelectProperty?: (property: PropertyListing) => void;
  onQuickView?: (property: PropertyListing) => void;
  onOpenProperty?: (propertyId: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved,
  onToggleSave,
  onSelectProperty,
  onQuickView,
  onOpenProperty,
}) => {
  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(property);
    } else if (onSelectProperty) {
      onSelectProperty(property);
    }
  };

  // Requirement 1: Open Property Cards in the SAME TAB!
  // No target="_blank", no window.open()
  const handleOpenProperty = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (onOpenProperty) {
      onOpenProperty(property.id);
      return;
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('property', property.id);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.pathname + url.search);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't trigger if clicked on wishlist button or quick view button
    if (target.closest('button')) {
      return;
    }
    handleOpenProperty(e);
  };

  // Pill items to display based on category
  const getPills = () => {
    const pills: string[] = [];
    if (property.areaSqFt) pills.push(`📐 ${property.areaSqFt.toLocaleString()} sq.ft`);
    if (property.landSqYds) pills.push(`${property.landSqYds} sq.yds`);
    if (property.landAcres) pills.push(`${property.landAcres} Acres`);
    if (property.facing) pills.push(property.facing);
    if (property.roadWidthFt) pills.push(`${property.roadWidthFt} Ft Road`);
    if (property.floorInfo) pills.push(property.floorInfo);
    if (property.parkingSlots) pills.push(property.parkingSlots);
    if (property.category === 'plots') pills.push('Clear Title');
    if (property.category === 'lands') pills.push('Borewell Ready', 'Red Soil');
    if (property.category === 'commercial') pills.push('Ground Floor', '100 Ft Frontage');
    return pills.slice(0, 3);
  };

  const pills = getPills();

  return (
    <div 
      id={`property-card-${property.id}`}
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
      title="Click to view property details"
    >
      {/* Image container */}
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
        <a 
          href={`?property=${property.id}`}
          onClick={handleOpenProperty}
          className="block w-full h-full cursor-pointer"
          title="View property details"
        >
          <img
            src={property.images[0]}
            alt={property.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </a>

        {/* Verified Badge & Property Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap pointer-events-none z-10 max-w-[calc(100%-60px)]">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-full shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>{property.primaryBadge}</span>
          </div>
          {property.propertyStatus && (
            <div className={`px-2 py-0.5 backdrop-blur-xs text-[10px] font-extrabold rounded-full shadow-md uppercase tracking-wider ${
              property.propertyStatus === 'NEW'
                ? 'bg-blue-600/90 text-white'
                : 'bg-slate-800/85 text-slate-100'
            }`}>
              {property.propertyStatus === 'NEW' ? 'NEW PROPERTY' : 'OLD PROPERTY'}
            </div>
          )}
        </div>

        {/* Wishlist Button - 44px touch hitbox for mobile thumbs */}
        <button
          id={`wishlist-btn-${property.id}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(property.id);
          }}
          className="absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-white active:scale-90 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-sm transition-all z-10 cursor-pointer"
          title={isSaved ? 'Remove from saved' : 'Save property'}
        >
          <Heart className={`w-4.5 h-4.5 ${isSaved ? 'fill-[#881324] text-[#881324]' : 'text-slate-600'}`} />
        </button>

        {/* Quick View Hover Button on Image */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-center pointer-events-none">
          <button
            id={`quick-view-overlay-${property.id}`}
            type="button"
            onClick={handleQuickView}
            className="pointer-events-auto py-1.5 px-3.5 bg-white/95 hover:bg-white text-slate-900 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 backdrop-blur-xs border border-slate-200 cursor-pointer"
            title="Open quick view modal"
          >
            <Eye className="w-3.5 h-3.5 text-[#77101F]" />
            <span>Quick View</span>
          </button>
        </div>

        {/* 0% Brokerage Chip bottom right */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded pointer-events-none">
          0% Brokerage
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          {/* Title - Fixed height with 2-line clamp for rock-solid row alignment */}
          <a
            href={`?property=${property.id}`}
            onClick={handleOpenProperty}
            className="block"
            title="View property details"
          >
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-[#881324] transition-colors line-clamp-2 min-h-[2.5rem]">
              {property.title}
            </h3>
          </a>

          {/* Location & Listed Date */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.locality}, {property.city}</span>
          </div>

          {/* Metric Specifications Pills */}
          <div className="flex flex-wrap gap-1.5 mt-2.5 min-h-[1.75rem] overflow-hidden">
            {pills.map((pill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold shrink-0"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Dedicated Price & CTA Footer - Always pinned at bottom, never cut off */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          {/* Price Row: Unobstructed, prominent, bold, never cut off */}
          <div className="flex items-baseline justify-between gap-2 mb-2.5">
            <div className="text-lg sm:text-xl font-black text-[#77101F] tracking-tight">
              {property.priceDisplay}
            </div>
            {property.pricePerUnit ? (
              <div className="text-[11px] text-slate-400 font-semibold truncate text-right">
                {property.pricePerUnit}
              </div>
            ) : (
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                0% Brokerage
              </div>
            )}
          </div>

          {/* Action Buttons: Responsive 2-column grid, consistent heights */}
          <div className="grid grid-cols-2 gap-2">
            {/* Quick View Button -> Opens in Modal Popup */}
            <button
              id={`quick-view-btn-${property.id}`}
              type="button"
              onClick={handleQuickView}
              className="min-h-[40px] px-2 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
              title="Quick view in modal popup"
            >
              <Eye className="w-3.5 h-3.5 text-[#77101F]" />
              <span>Quick View</span>
            </button>

            {/* Click to open in SAME TAB */}
            <button
              id={`view-details-${property.id}`}
              type="button"
              onClick={handleOpenProperty}
              className="min-h-[40px] px-2 py-1.5 bg-[#77101F] hover:bg-[#600c19] active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              title="View full property details"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-red-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
