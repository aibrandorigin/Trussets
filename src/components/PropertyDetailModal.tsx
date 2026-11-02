import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  FileCheck, 
  LandPlot, 
  Building2, 
  Compass, 
  Share2, 
  Heart,
  Car,
  AlertCircle,
  Check,
  ExternalLink
} from 'lucide-react';
import { PropertyListing } from '../types';
import { TrussetsLogo } from './TrussetsLogo';

interface PropertyDetailModalProps {
  property: PropertyListing | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenProperty?: (id: string) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  onClose,
  isSaved,
  onToggleSave,
  onOpenProperty,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showPhoneDirect, setShowPhoneDirect] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  if (!property) return null;

  const handleOpenInSameTab = () => {
    if (onOpenProperty) {
      onOpenProperty(property.id);
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('property', property.id);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.pathname + url.search);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    onClose();
  };

  const handleCallOwner = () => {
    setShowPhoneDirect(true);
    setContactSuccess(`Calling Direct Owner: ${property.ownerPhone}`);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi, I saw your property "${property.title}" on Trussets (0% Brokerage). I am an authentic direct buyer/tenant interested in scheduling a site visit.`);
    window.open(`https://wa.me/${property.ownerWhatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div 
        id="property-detail-modal"
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <TrussetsLogo size="sm" />
            <span className="text-slate-200 hidden sm:inline">|</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {property.primaryBadge}
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-red-50 text-[#881324] text-[11px] font-bold">
              0% Brokerage • Direct Owner
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="modal-open-in-same-tab"
              type="button"
              onClick={handleOpenInSameTab}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="View full property details in this tab"
            >
              <ExternalLink className="w-4 h-4 text-[#77101F]" />
              <span className="hidden sm:inline">View Full Page</span>
            </button>
            <button
              onClick={() => onToggleSave(property.id)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
              title="Save property"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-[#881324] text-[#881324]' : ''}`} />
            </button>
            <button
              id="close-property-detail-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Images Gallery */}
          <div className="space-y-2">
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={property.images[activeImageIdx]}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold rounded-lg">
                Photo {activeImageIdx + 1} of {property.images.length}
              </div>
            </div>

            {property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIdx === idx ? 'border-[#881324] scale-102' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title, Subtitle, Price */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-snug">
                {property.title}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                {property.subtitle}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {property.locality}, {property.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Listed on {property.listedDate}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right bg-red-50/50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-red-100">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {property.priceDisplay}
              </div>
              <div className="text-xs text-[#881324] font-bold mt-0.5">
                {property.isNegotiable ? '✓ Price is Negotiable' : 'Fixed Market Price'}
              </div>
              {property.pricePerUnit && (
                <div className="text-xs text-slate-400 font-medium">
                  {property.pricePerUnit}
                </div>
              )}
            </div>
          </div>

          {/* Owner Connect Bar */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-full bg-[#881324] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                {property.uploaderName.charAt(0)}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Direct Verified Seller
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{property.uploaderName}</h4>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Aadhaar & Title Audited (Zero Brokerage)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                id="call-direct-owner-btn"
                onClick={handleCallOwner}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{showPhoneDirect ? property.ownerPhone : 'Call Owner Direct'}</span>
              </button>

              <button
                id="whatsapp-direct-owner-btn"
                onClick={handleWhatsApp}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {contactSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
              {contactSuccess} — No broker commissions apply.
            </div>
          )}

          {/* Trust & KYC Verification Matrix */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#881324]" />
              Mandatory Legal & Verification Audit
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Title Deed Status</span>
                <span className="font-bold text-emerald-800 mt-0.5 block">✓ Registered Sale Deed Clear</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Encumbrance (EC)</span>
                <span className="font-bold text-emerald-800 mt-0.5 block">✓ {property.ecYears}-Year Nil EC</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sanctioning Authority</span>
                <span className="font-bold text-emerald-800 mt-0.5 block">{property.municipalApproval}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">RERA Status</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {property.reraNumber ? `Registered (${property.reraNumber})` : 'Individual Clear Title'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Mortgage Status</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{property.mortgageStatus}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Pending Litigations</span>
                <span className="font-bold text-emerald-700 mt-0.5 block">None (0 Court Cases)</span>
              </div>
            </div>
          </div>

          {/* Key Specifications Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Property Specifications & Measurements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {property.areaSqFt && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Built-up Area</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{property.areaSqFt.toLocaleString()} Sq.Ft</span>
                </div>
              )}
              {property.landSqYds && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Plot / Land Area</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{property.landSqYds} Sq.Yds</span>
                </div>
              )}
              {property.landAcres && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Land Extent</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{property.landAcres} Acres</span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Property Status</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {property.propertyStatus === 'NEW' ? 'New Property' : property.propertyStatus === 'OLD' ? 'Old Property' : 'Not Specified'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Age of Property</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {property.propertyAge !== null && property.propertyAge !== undefined
                    ? `${property.propertyAge} Years`
                    : (property.propertyAgeYears !== undefined ? `${property.propertyAgeYears} Years` : 'Not Specified')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Facing Direction</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{property.facing}</span>
              </div>
              {property.roadWidthFt && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Approach Road</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{property.roadWidthFt} Ft Width</span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">Possession</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{property.possessionStatus}</span>
              </div>
              {property.furnishing && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Furnishing</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{property.furnishing}</span>
                </div>
              )}
              {property.sro && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Jurisdiction SRO</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{property.sro}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Property Overview
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {property.description}
            </p>
          </div>

          {/* Amenities Checklist */}
          {property.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Verified Amenities & Infrastructure
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {property.amenities.map((item) => (
                  <div key={item} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Highlights */}
          {property.locationHighlights.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Location & Connectivity Highlights
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                {property.locationHighlights.map((hl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#881324] shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              {property.googleMapLink && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <a
                    href={property.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#881324] text-xs font-bold rounded-xl border border-red-200 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View Exact Location on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            SRO Registration: <span className="font-semibold text-slate-800">{property.sro || 'Local Jurisdiction'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCallOwner}
              className="px-5 py-2 rounded-xl bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Contact Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
