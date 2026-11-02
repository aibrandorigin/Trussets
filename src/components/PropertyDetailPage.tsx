import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  Heart, 
  Share2, 
  Phone, 
  MessageSquare, 
  Building2, 
  Home, 
  Compass, 
  Ruler, 
  Car, 
  FileCheck, 
  Check, 
  Copy, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  Eye,
  Maximize2,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { PropertyListing, UserProfile } from '../types';
import { PropertyCard } from './PropertyCard';
import { propertyAccessService, EntitlementCheckResult, ProtectedDetails } from '../services/propertyAccessService';

interface PropertyDetailPageProps {
  property: PropertyListing;
  allProperties: PropertyListing[];
  onBackToListings: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onQuickView: (property: PropertyListing) => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
  onNavigateToPlans: (type: 'buying' | 'rental', propertyId: string) => void;
  onOpenProperty?: (propertyId: string) => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  property,
  allProperties,
  onBackToListings,
  isSaved,
  onToggleSave,
  onQuickView,
  user,
  onOpenLogin,
  onNavigateToPlans,
  onOpenProperty,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showPhoneDirect, setShowPhoneDirect] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [visitRequested, setVisitRequested] = useState(false);

  // Centralized Server-Side Access Control State (Requirement 14)
  const [accessState, setAccessState] = useState<EntitlementCheckResult | null>(null);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);

  // Scroll to top when loaded
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [property.id]);

  // Revalidate server-side entitlement on mount and whenever user changes (Requirement 12, 14, 16)
  const verifyAccess = async () => {
    setIsVerifyingAccess(true);
    try {
      const result = await propertyAccessService.checkPropertyAccess(property.id, user?.id);
      setAccessState(result);
    } catch (e) {
      console.error('Error checking property access:', e);
    } finally {
      setIsVerifyingAccess(false);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, [property.id, user?.id, user?.planId, user?.planEndDate, user?.status]);

  const hasAccess = accessState?.hasAccess || false;
  const protectedDetails: ProtectedDetails | undefined = accessState?.protectedDetails;

  // Unmasked or masked details based on entitlement
  const displayOwnerName = hasAccess
    ? protectedDetails?.uploaderName || property.uploaderName
    : property.uploaderName.includes('•')
    ? property.uploaderName
    : 'Direct Property Owner';

  const displayOwnerPhone = hasAccess
    ? protectedDetails?.ownerPhone || property.ownerPhone
    : '+91 98490 •••••';

  const displayOwnerWhatsapp = hasAccess
    ? protectedDetails?.ownerWhatsapp || property.ownerWhatsapp
    : '';

  const displayExactAddress = hasAccess && protectedDetails?.exactAddress
    ? protectedDetails.exactAddress
    : `${property.locality}, ${property.city} (Exact plot/door number locked)`;

  const displayGoogleMap = hasAccess
    ? protectedDetails?.googleMapLink || property.googleMapLink
    : null;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Requirement 5: Details Button Behavior & Contact Checks
  const handleContactAction = (action: 'call' | 'whatsapp' | 'visit') => {
    // Case A: User has access
    if (hasAccess) {
      if (action === 'call') {
        setShowPhoneDirect(true);
        if (displayOwnerPhone && !displayOwnerPhone.includes('•')) {
          window.location.href = `tel:${displayOwnerPhone}`;
        }
      } else if (action === 'whatsapp') {
        if (displayOwnerWhatsapp) {
          const text = encodeURIComponent(
            `Hi ${displayOwnerName}, I saw your property "${property.title}" on TrustSets (0% Brokerage). I am an authentic direct buyer/tenant interested in scheduling a site visit.`
          );
          window.open(`https://wa.me/${displayOwnerWhatsapp}?text=${text}`, '_blank', 'noopener,noreferrer');
        }
      }
      return;
    }

    // Case C: User is not logged in -> Redirect to Login first
    if (!user) {
      onOpenLogin();
      return;
    }

    // Case B: User is logged in but has no active applicable plan -> Redirect to specific relevant Plans page
    const requiredType = property.transactionType === 'rent' ? 'rental' : 'buying';
    onNavigateToPlans(requiredType, property.id);
  };

  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) {
      handleContactAction('visit');
      return;
    }
    if (!visitDate) return;
    setVisitRequested(true);
  };

  // Find similar properties in the same city
  const similarProperties = allProperties
    .filter((p) => p.id !== property.id && (p.city || '').toLowerCase() === (property.city || '').toLowerCase())
    .slice(0, 3);

  const requiredPlanType = property.transactionType === 'rent' ? 'rental' : 'buying';

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 lg:pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onBackToListings}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold transition-all cursor-pointer shrink-0"
              title="Return to property search and listings"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="sm:inline">Back</span>
            </button>

            <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <button onClick={onBackToListings} className="hover:text-slate-900 truncate">
                Home
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="capitalize">{property.transactionType === 'rent' ? 'For Rent' : 'For Sale'}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{property.city}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-900 font-semibold truncate max-w-[200px]">{property.title}</span>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Plan status indicator */}
            {hasAccess ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Access Unlocked</span>
              </span>
            ) : (
              <button
                onClick={() => onNavigateToPlans(requiredPlanType, property.id)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Plan Required</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              title="Copy link to share"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1.5">{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={() => onToggleSave(property.id)}
              className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                isSaved
                  ? 'bg-red-50 text-[#881324] border-red-200 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#881324] text-[#881324]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline ml-1.5">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Requirement 11: Locked Details UI / Entitlement Alert Banner */}
        {!hasAccess && !isVerifyingAccess && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-red-50 to-amber-50 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800 shrink-0 mt-0.5">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    🔒 Property Details & Direct Contact Locked
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold uppercase">
                    {accessState?.requiredPlanType || (property.transactionType === 'rent' ? 'Rental' : 'Buying')} Plan Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {accessState?.message ||
                    'An active property plan is required to access the complete property and direct owner contact details.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!user ? (
                <button
                  id="locked-login-btn"
                  onClick={onOpenLogin}
                  className="px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Log In / Sign Up
                </button>
              ) : (
                <button
                  id="locked-view-plans-btn"
                  onClick={() => onNavigateToPlans(requiredPlanType, property.id)}
                  className="px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View {property.transactionType === 'rent' ? 'Rental Plans' : 'Buying Plans'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {hasAccess && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {accessState?.reason === 'OWNER_ACCESS'
                  ? 'Verified Listing Owner: You have full access to your property listing.'
                  : accessState?.reason === 'ADMIN_ACCESS'
                  ? 'Administrator Access: Full property details and contact numbers unlocked.'
                  : `Active Plan Verified: ${accessState?.message || 'Direct owner contact unlocked.'}`}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold">
              0% Brokerage
            </span>
          </div>
        )}

        {/* Hero Gallery & Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Left Column: Interactive Image Gallery */}
          <div className="lg:col-span-8 space-y-3">
            <div className="relative aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 shadow-md group border border-slate-200">
              <img
                src={property.images[activeImageIdx]}
                alt={`${property.title} view ${activeImageIdx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Verified Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-800/90 backdrop-blur-xs text-white text-xs font-bold rounded-full shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{property.primaryBadge}</span>
              </div>

              {/* Zero Brokerage Badge */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#77101F]/90 backdrop-blur-xs text-white text-xs font-bold rounded-full shadow-lg">
                0% Brokerage • Direct Owner
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-xs text-white text-xs font-medium rounded-full">
                {activeImageIdx + 1} / {property.images.length} Photos
              </div>
            </div>

            {/* Thumbnails list */}
            {property.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-[#77101F] ring-2 ring-[#77101F]/20 scale-102'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Key Summary & Primary Action Card */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {property.categoryName}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">ID: {property.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {property.title}
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">{property.subtitle}</p>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">
                    {property.transactionType === 'rent' ? 'Monthly Rent' : 'Total Price'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#77101F] tracking-tight">
                    {property.priceDisplay}
                  </div>
                  {property.pricePerUnit && (
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {property.pricePerUnit}
                    </div>
                  )}
                </div>
                {property.isNegotiable && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Negotiable
                  </span>
                )}
              </div>

              {/* Location & Address */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#77101F] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">{property.locality}, {property.city}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {displayExactAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-slate-400 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Listed on {property.listedDate}</span>
                </div>
              </div>
            </div>

            {/* Direct Contact CTA Card with Access Protection (Requirement 4, 11) */}
            <div className={`p-6 rounded-3xl shadow-sm space-y-4 transition-all ${
              hasAccess ? 'bg-[#540B16] text-white' : 'bg-slate-900 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {hasAccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Verified Direct Owner Contact</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">Contact Details Protected</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] font-bold text-white/70">0% Brokerage</span>
              </div>

              {hasAccess ? (
                <>
                  <p className="text-xs text-red-100/90 leading-relaxed">
                    Connect directly with <strong>{displayOwnerName}</strong> without any middleman or commission.
                  </p>

                  <div className="pt-1 flex flex-col gap-2.5">
                    <button
                      id="call-owner-btn-unlocked"
                      onClick={() => handleContactAction('call')}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-[#77101F] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Phone className="w-4 h-4 text-[#77101F]" />
                      <span>{showPhoneDirect ? displayOwnerPhone : `Call Owner: ${displayOwnerPhone}`}</span>
                    </button>

                    <button
                      id="whatsapp-owner-btn-unlocked"
                      onClick={() => handleContactAction('whatsapp')}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Direct Owner</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                    <div className="text-slate-300">Owner Contact: <span className="font-mono font-bold text-white">{displayOwnerPhone}</span></div>
                    <div className="text-slate-400 text-[11px]">Exact phone & WhatsApp locked behind an active plan.</div>
                  </div>

                  <div className="pt-1 space-y-2">
                    {!user ? (
                      <button
                        id="locked-login-action-btn"
                        onClick={onOpenLogin}
                        className="w-full py-3 px-4 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Log In to Unlock Owner Details</span>
                      </button>
                    ) : (
                      <button
                        id="locked-plans-action-btn"
                        onClick={() => onNavigateToPlans(requiredPlanType, property.id)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>
                          View {property.transactionType === 'rent' ? 'Rental Plans' : 'Buying Plans'} to Unlock
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs / Main Specs & Legal Integrity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column: Description, Legal Verification & Amenities */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About this Property</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Legal & Title Deed Integrity Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Legal & Title Deed Verification</h2>
                    <p className="text-xs text-slate-500">Independent documentation audit under Indian Registration Act</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Verified Clean
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-medium">Encumbrance Certificate (EC)</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">
                    {property.ecYears}-Year Clear EC • Zero Prior Claims
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-medium">Sub-Registrar Jurisdiction (SRO)</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">
                    {hasAccess ? (protectedDetails?.sro || property.sro || 'Local District Office') : 'Verified SRO Jurisdiction'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-medium">Municipal & Development Approval</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">
                    {property.municipalApproval} Approved Layout
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-medium">Court Litigations & Disputes</span>
                  <span className="text-emerald-700 font-bold mt-0.5 block">
                    None (Zero Pending Cases in Indian Courts)
                  </span>
                </div>
              </div>
            </div>

            {/* Key Specifications & Measurements */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">Specifications & Key Measurements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {property.bhk && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Configuration</span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">{property.bhk}</strong>
                  </div>
                )}
                {property.areaSqFt && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Super Built-up</span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">{property.areaSqFt.toLocaleString()} sq.ft</strong>
                  </div>
                )}
                {property.landSqYds && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Plot Area</span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">{property.landSqYds} sq.yds</strong>
                  </div>
                )}
                {property.landAcres && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Land Extent</span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">{property.landAcres} Acres</strong>
                  </div>
                )}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Property Status</span>
                  <strong className="text-slate-900 font-bold mt-0.5 block">
                    {property.propertyStatus === 'NEW' ? 'New Property' : property.propertyStatus === 'OLD' ? 'Old Property' : 'Not Specified'}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Age of Property</span>
                  <strong className="text-slate-900 font-bold mt-0.5 block">
                    {property.propertyAge !== null && property.propertyAge !== undefined
                      ? `${property.propertyAge} Years`
                      : (property.propertyAgeYears !== undefined ? `${property.propertyAgeYears} Years` : 'Not Specified')}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Facing Direction</span>
                  <strong className="text-slate-900 font-bold mt-0.5 block">{property.facing}</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">Possession</span>
                  <strong className="text-emerald-700 font-bold mt-0.5 block">{property.possessionStatus}</strong>
                </div>
                {property.parkingSlots && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Parking</span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">{property.parkingSlots}</strong>
                  </div>
                )}
                {property.roadWidthFt && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Approach Road</span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">{property.roadWidthFt} Ft Width</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities Section */}
            {property.amenities.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-4">Amenities & Infrastructure Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Micro-Market Highlights */}
            {property.locationHighlights.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-bold text-slate-900">Micro-Market Connectivity & Landmarks</h2>
                  {displayGoogleMap ? (
                    <a
                      href={displayGoogleMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#77101F] rounded-xl text-xs font-bold border border-red-200 transition-colors w-fit"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      🔒 Exact GPS map link unlocked with active plan
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.locationHighlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
                    >
                      <MapPin className="w-4 h-4 text-[#77101F] shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Schedule Visit & Direct Owner Verification */}
          <div className="lg:col-span-4 space-y-6">
            {/* Schedule Site Visit Form Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Schedule a Site Visit</h3>
              <p className="text-xs text-slate-500 mb-4">
                Choose a convenient day to visit and inspect the property in person.
              </p>

              {visitRequested ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-900">Visit Request Sent!</h4>
                  <p className="text-[11px] text-emerald-700">
                    The owner <strong>{displayOwnerName}</strong> has been notified for your visit on {visitDate} at {visitTime}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleScheduleVisit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time Slot</label>
                    <select
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                    >
                      <option value="10:00 AM">10:00 AM - Morning</option>
                      <option value="11:30 AM">11:30 AM - Morning</option>
                      <option value="02:30 PM">02:30 PM - Afternoon</option>
                      <option value="04:30 PM">04:30 PM - Evening</option>
                      <option value="06:00 PM">06:00 PM - Evening</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {!hasAccess && <Lock className="w-3.5 h-3.5" />}
                    <span>Request Free Site Visit</span>
                  </button>
                </form>
              )}
            </div>

            {/* Direct Owner Profile Info */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Listed Directly By
              </h3>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#77101F]/10 text-[#77101F] font-black text-base flex items-center justify-center border border-red-200">
                  {displayOwnerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{displayOwnerName}</h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {property.uploaderType === 'individual' 
                      ? 'Direct Property Owner' 
                      : property.uploaderType === 'builder' 
                      ? 'Authorized Builder Partner' 
                      : 'Landlord Legal Representative'}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Government ID & Aadhaar KYC Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Physical title document ownership verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>0% Brokerage guaranteed by TrustSets</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Verified Properties Section (Requirement 1: opens in SAME TAB) */}
        {similarProperties.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Similar Verified Properties in {property.city}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explore other zero-brokerage listings in matching categories (Clicking opens in same tab)
                </p>
              </div>
              <button
                onClick={onBackToListings}
                className="text-xs font-bold text-[#77101F] hover:underline"
              >
                View all properties →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isSaved={false}
                  onToggleSave={onToggleSave}
                  onSelectProperty={() => onQuickView(p)}
                  onQuickView={onQuickView}
                  onOpenProperty={onOpenProperty}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom CTA Bar (Thumb-Zone Natural Reach) */}
      <div 
        id="property-detail-mobile-bottom-bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden px-4 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 10px), 10px)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
            {property.transactionType === 'rent' ? 'Monthly Rent' : 'Direct Owner Price'}
          </div>
          <div className="text-base font-black text-[#77101F] tracking-tight truncate">
            {property.priceDisplay}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasAccess ? (
            <>
              <button
                type="button"
                id="mobile-bottom-call-btn"
                onClick={() => handleContactAction('call')}
                className="h-11 px-3.5 bg-[#77101F] hover:bg-[#600c19] active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Owner</span>
              </button>
              <button
                type="button"
                id="mobile-bottom-whatsapp-btn"
                onClick={() => handleContactAction('whatsapp')}
                className="h-11 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </>
          ) : !user ? (
            <button
              type="button"
              id="mobile-bottom-login-btn"
              onClick={onOpenLogin}
              className="h-11 px-4 bg-[#77101F] hover:bg-[#600c19] active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Log In to Unlock</span>
            </button>
          ) : (
            <button
              type="button"
              id="mobile-bottom-unlock-btn"
              onClick={() => onNavigateToPlans(requiredPlanType, property.id)}
              className="h-11 px-4 bg-gradient-to-r from-amber-500 to-amber-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>View Plans to Unlock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
