import React, { useState } from 'react';
import { 
  Building2, 
  Mountain, 
  Home, 
  Tractor, 
  Building, 
  TreePine, 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  ArrowLeft, 
  ArrowRight,
  Check,
  Info,
  Tag,
  KeyRound,
  Coins,
  Calendar,
  Users,
  Warehouse,
  BedDouble,
  Zap,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';
import { PropertyListing, PropertyCategory, UploaderType, TransactionType, PropertyStatus, UserProfile } from '../types';
import { TrussetsLogo } from './TrussetsLogo';

interface PostPropertyWizardProps {
  currentCity: string;
  initialTransactionType?: TransactionType;
  initialProperty?: PropertyListing | null;
  mode?: 'create' | 'edit';
  user?: UserProfile | null;
  onListingCreated: (newListing: PropertyListing) => void;
  onCancel: () => void;
}

export const PostPropertyWizard: React.FC<PostPropertyWizardProps> = ({
  currentCity,
  initialTransactionType = 'buy',
  initialProperty = null,
  mode = 'create',
  user = null,
  onListingCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Primary Selection: Sell Property vs Rent Property
  const [transactionType, setTransactionType] = useState<TransactionType>(
    initialProperty?.transactionType || initialTransactionType
  );

  // Step 1: Category
  const [selectedType, setSelectedType] = useState<PropertyCategory>(
    initialProperty?.category || (initialTransactionType === 'rent' ? 'apartments' : 'villas')
  );

  // Property Status & Age Attributes (Requirement 1 & 2)
  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>(
    initialProperty?.propertyStatus || (initialProperty?.propertyAge === 0 ? 'NEW' : initialProperty?.propertyAge ? 'OLD' : 'NEW')
  );
  const [propertyAge, setPropertyAge] = useState<string>(
    initialProperty?.propertyAge !== undefined && initialProperty?.propertyAge !== null
      ? String(initialProperty.propertyAge)
      : (initialProperty?.propertyAgeYears !== undefined ? String(initialProperty.propertyAgeYears) : (initialProperty?.propertyStatus === 'OLD' ? '5' : '0'))
  );
  const [propertyAgeError, setPropertyAgeError] = useState<string | null>(null);

  // Age validator helper
  const validateAge = (status: PropertyStatus, ageStr: string): boolean => {
    if (ageStr.trim() === '') {
      if (status === 'OLD') {
        setPropertyAgeError('Age of property is required for Old Property.');
        return false;
      }
      setPropertyAgeError(null);
      return true;
    }
    const num = Number(ageStr);
    if (isNaN(num)) {
      setPropertyAgeError('Please enter numbers only.');
      return false;
    }
    if (num < 0) {
      setPropertyAgeError('Age of property cannot be negative. Minimum value is 0 Years.');
      return false;
    }
    setPropertyAgeError(null);
    return true;
  };

  // Step 2: Specs (Clean unpopulated states or pre-filled if editing)
  const [title, setTitle] = useState(initialProperty?.title || '');
  const [bhk, setBhk] = useState(initialProperty?.bhk || '');
  const [areaSqFt, setAreaSqFt] = useState<string>(initialProperty?.areaSqFt ? String(initialProperty.areaSqFt) : '');
  const [landSqYds, setLandSqYds] = useState<string>(initialProperty?.landSqYds ? String(initialProperty.landSqYds) : '');
  const [landAcres, setLandAcres] = useState<string>(initialProperty?.landAcres ? String(initialProperty.landAcres) : '');
  const [facing, setFacing] = useState(initialProperty?.facing || '');
  const [floorInfo, setFloorInfo] = useState(initialProperty?.floorInfo || '');
  const [furnishing, setFurnishing] = useState<'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished'>(
    initialProperty?.furnishing || 'Semi-Furnished'
  );
  const [possession, setPossession] = useState<'Ready for Registration' | 'Ready to Move In' | 'Under Construction (2025-2026)'>(
    initialProperty?.possessionStatus || 'Ready to Move In'
  );
  
  // Rental specific Step 2 fields
  const [preferredTenants, setPreferredTenants] = useState<'Family Only' | 'Bachelors Allowed' | 'Company Lease' | 'Any (Family/Bachelors)'>('Any (Family/Bachelors)');
  const [availableFrom, setAvailableFrom] = useState<'Immediate' | 'Within 15 Days' | '1st of Next Month'>('Immediate');
  const [leasePeriodMonths, setLeasePeriodMonths] = useState<number>(11);

  // Step 3: Verification & KYC Layer
  const [uploaderType, setUploaderType] = useState<UploaderType>('individual');
  const [uploaderRelation, setUploaderRelation] = useState('Property Owner');
  const [ownerName, setOwnerName] = useState(initialProperty?.ownerName || user?.name || '');
  const [ownerPhone, setOwnerPhone] = useState(initialProperty?.ownerPhone || user?.phone || '');

  // Documents for Sell (un-uploaded by default so user uploads real documents)
  const [saleDeedUploaded, setSaleDeedUploaded] = useState(false);
  const [ecUploaded, setEcUploaded] = useState(false);
  const [pattaUploaded, setPattaUploaded] = useState(false);
  const [kycUploaded, setKycUploaded] = useState(false);

  // Documents for Rent
  const [ownershipProofUploaded, setOwnershipProofUploaded] = useState(false);
  const [societyNocUploaded, setSocietyNocUploaded] = useState(false);
  const [landlordKycUploaded, setLandlordKycUploaded] = useState(false);
  const [standardAgreementDraft, setStandardAgreementDraft] = useState(false);

  // Step 4: Pricing, Terms & Location (Empty - user enters their actual price & locality)
  const [sellPriceNumeric, setSellPriceNumeric] = useState<string>('');
  const [monthlyRentNumeric, setMonthlyRentNumeric] = useState<string>('');
  const [depositNumeric, setDepositNumeric] = useState<string>('');
  const [maintenanceMode, setMaintenanceMode] = useState<'included' | 'additional'>('included');
  const [additionalMaintenance, setAdditionalMaintenance] = useState<string>('');

  const [isNegotiable, setIsNegotiable] = useState(true);
  const [locality, setLocality] = useState('');
  const [district, setDistrict] = useState('');
  const [sroOffice, setSroOffice] = useState('');
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [locationHighlights, setLocationHighlights] = useState('');
  const [mortgageStatus, setMortgageStatus] = useState<'Free From Loan' | 'Under Loan' | 'NPA / Loan Default'>('Free From Loan');
  const [courtLitigations, setCourtLitigations] = useState<'No' | 'Yes'>('No');

  // Step 5: Amenities Checklist (Empty by default so user picks actual amenities)
  const [selectedSellAmenities, setSelectedSellAmenities] = useState<string[]>([]);
  const [selectedRentAmenities, setSelectedRentAmenities] = useState<string[]>([]);

  // Step 6: Published state
  const [isPublished, setIsPublished] = useState(false);
  const [publishedId, setPublishedId] = useState('');

  // Handle Intent Switch (Sell vs Rent) - No auto-filling mock titles!
  const handleIntentChange = (newType: TransactionType) => {
    setTransactionType(newType);
    if (newType === 'buy') {
      if (selectedType === 'all') setSelectedType('villas');
    } else {
      if (['plots', 'lands'].includes(selectedType)) {
        setSelectedType('apartments');
      }
    }
  };

  // Categories tailored for Sell
  const sellCategories = [
    {
      id: 'plots' as PropertyCategory,
      title: 'Plots & Layouts',
      desc: 'HMDA, DTCP, RERA Approved & Farm plots',
      icon: Mountain,
    },
    {
      id: 'villas' as PropertyCategory,
      title: 'Villas & Houses',
      desc: 'Gated community duplex, triplex & bungalows',
      icon: Home,
    },
    {
      id: 'apartments' as PropertyCategory,
      title: 'Apartments / Flats',
      desc: 'High-rise towers, builder floors & penthouses',
      icon: Building2,
    },
    {
      id: 'lands' as PropertyCategory,
      title: 'Agricultural Land',
      desc: 'Farmland, fertile passbook lands in acres',
      icon: Tractor,
    },
    {
      id: 'commercial' as PropertyCategory,
      title: 'Commercial Buildings',
      desc: 'Retail showrooms, office spaces & shops',
      icon: Building,
    },
    {
      id: 'farmhouses' as PropertyCategory,
      title: 'Farmhouses & Estates',
      desc: 'Weekend luxury resorts & retreat estates',
      icon: TreePine,
    },
  ];

  // Categories tailored for Rent
  const rentCategories = [
    {
      id: 'apartments' as PropertyCategory,
      title: 'Apartments / Flats',
      desc: '1, 2, 3, 4 BHK & Penthouses for rent',
      icon: Building2,
    },
    {
      id: 'villas' as PropertyCategory,
      title: 'Houses & Villas',
      desc: 'Gated community villas & standalone homes',
      icon: Home,
    },
    {
      id: 'commercial' as PropertyCategory,
      title: 'Commercial Office / Shop',
      desc: 'Corporate offices, retail outlets & shops',
      icon: Building,
    },
    {
      id: 'farmhouses' as PropertyCategory,
      title: 'Farmhouse for Rent / Stay',
      desc: 'Weekend leisure getaways & farm retreats',
      icon: TreePine,
    },
    {
      id: 'lands' as PropertyCategory,
      title: 'Warehouse / Industrial Shed',
      desc: 'Logistics storage, godowns & sheds',
      icon: Warehouse,
    },
    {
      id: 'plots' as PropertyCategory,
      title: 'Commercial Open Yard / Land',
      desc: 'Open parking yards, fleet hubs & storage land',
      icon: Mountain,
    },
  ];

  const currentCategories = transactionType === 'buy' ? sellCategories : rentCategories;

  // Amenities for Sell - removed parking and approvals group, added 2 wheeler, 4 wheeler and dedicated EV station to infrastructure
  const sellAmenityGroups = [
    {
      name: '🔹 1. Infrastructure & Utilities',
      items: [
        '2-Wheeler Parking',
        '4-Wheeler Parking',
        'Dedicated EV Station',
        'Power Backup / Generator',
        'Underground Cabling',
        'Water Supply',
        'Underground Drainage',
        'Rainwater Harvesting',
        'Roads (BT / CC Internal)'
      ]
    },
    {
      name: '🔹 2. Safety & Security',
      items: ['Gated Community Security', 'Grand Entrance Arch/Gate', '24x7 Security Personnel', 'CCTV Surveillance', 'Fire Safety & Hydrant System']
    },
    {
      name: '🔹 3. Building Comforts & Club',
      items: ['High-Speed Lift / Elevator', 'Central Air Conditioning/HVAC', 'Solar Water Heater / Geyser', 'Clubhouse / Community Hall', 'Gym & Fitness', 'Swimming Pool']
    }
  ];

  // Amenities for Rent
  const rentAmenityGroups = [
    {
      name: '🔹 1. Infrastructure & Parking',
      items: [
        '2-Wheeler Parking',
        '4-Wheeler Parking',
        'Dedicated EV Station',
        'Power Backup / Inverter',
        '24x7 Manjeera / Borewell Water',
        'Elevator / Lift with ARD'
      ]
    },
    {
      name: '🛋️ 2. Appliances & Furnishings',
      items: ['Air Conditioners (AC)', 'Modular Kitchen with Chimney', 'Geysers in Bathrooms', 'Water Purifier (RO)', 'Full Bedroom Wardrobes', 'Sofa & Center Table', 'Dining Table Set', 'Double Beds with Mattresses']
    },
    {
      name: '🛡️ 3. Society & Tenancy Norms',
      items: ['Gated Society Security', '24x7 Security Personnel', 'CCTV Surveillance', 'Swimming Pool & Gym Access', 'Children\'s Play Area', 'Pet Friendly Allowed', 'Non-Veg Cooking Permitted']
    }
  ];

  const currentAmenityGroups = transactionType === 'buy' ? sellAmenityGroups : rentAmenityGroups;
  const currentSelectedAmenities = transactionType === 'buy' ? selectedSellAmenities : selectedRentAmenities;

  const toggleAmenity = (item: string) => {
    if (transactionType === 'buy') {
      setSelectedSellAmenities(prev => 
        prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
      );
    } else {
      setSelectedRentAmenities(prev => 
        prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
      );
    }
  };

  // Submission handler
  const handleNext = () => {
    // Validate age on Step 2
    if (currentStep === 2) {
      const isAgeValid = validateAge(propertyStatus, propertyAge);
      if (!isAgeValid) return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalize and publish
      let finalPrice = 0;
      let displayPrice = '';
      let pricePerUnitStr = '';

      if (transactionType === 'buy') {
        finalPrice = Number(sellPriceNumeric) || 15000000;
        if (finalPrice >= 10000000) {
          displayPrice = `₹${(finalPrice / 10000000).toFixed(2)} Cr`;
        } else if (finalPrice >= 100000) {
          displayPrice = `₹${(finalPrice / 100000).toFixed(1)} Lakhs`;
        } else {
          displayPrice = `₹${finalPrice.toLocaleString()}`;
        }
        pricePerUnitStr = `₹${Math.round(finalPrice / (Number(areaSqFt) || 2000)).toLocaleString()} / sq.ft`;
      } else {
        // Rent
        finalPrice = Number(monthlyRentNumeric) || 35000;
        displayPrice = `₹${finalPrice.toLocaleString()}/mo`;
        pricePerUnitStr = `Deposit: ₹${(Number(depositNumeric) || finalPrice * 2).toLocaleString()}`;
      }

      const activeCategoryObj = currentCategories.find(c => c.id === selectedType) || currentCategories[0];

      const parsedAge = propertyAge.trim() !== '' ? Number(propertyAge) : (propertyStatus === 'NEW' ? 0 : null);

      const newListing: PropertyListing = {
        id: initialProperty?.id || `prop-${Date.now()}`,
        title: title || (transactionType === 'buy' 
          ? `${bhk ? `${bhk} ` : ''}Property at ${locality || currentCity}`
          : `${bhk ? `${bhk} ` : ''}Rental at ${locality || currentCity}`),
        subtitle: `${locality || currentCity} • ${activeCategoryObj.title}`,
        transactionType,
        category: selectedType,
        categoryName: activeCategoryObj.title,
        propertyStatus,
        propertyAge: parsedAge,
        propertyAgeYears: parsedAge !== null ? parsedAge : undefined,
        price: finalPrice,
        priceDisplay: displayPrice,
        pricePerUnit: pricePerUnitStr,
        isNegotiable,
        city: currentCity,
        locality: locality || currentCity,
        district: district || currentCity,
        state: 'Telangana',
        sro: sroOffice,
        googleMapLink: googleMapLink.trim() || undefined,
        listedDate: initialProperty?.listedDate || 'Just Now',
        bhk: bhk || undefined,
        areaSqFt: Number(areaSqFt) || 2100,
        landSqYds: Number(landSqYds) || 200,
        landAcres: Number(landAcres) || 1.0,
        facing: facing || 'East Facing',
        floorInfo: transactionType === 'rent' ? floorInfo : undefined,
        furnishing,
        possessionStatus: possession,
        primaryBadge: transactionType === 'buy' ? '✓ Verified Deed' : '✓ Verified Landlord',
        badgeType: transactionType === 'buy' ? 'verified-deed' : 'verified-owner',
        uploaderType,
        uploaderName: `${ownerName.trim() || user?.name || 'Property Owner'} (${uploaderRelation})`,
        ownerPhone: ownerPhone.trim() || user?.phone || '',
        ownerWhatsapp: (ownerPhone.trim() || user?.phone || '').replace(/[^0-9]/g, ''),
        reraApproved: true,
        municipalApproval: 'Municipal Sanctioned',
        ecYears: transactionType === 'buy' ? 30 : 0,
        saleDeedVerified: transactionType === 'buy' ? saleDeedUploaded : ownershipProofUploaded,
        mortgageStatus,
        courtLitigations,
        bankLoanSanctions: transactionType === 'buy' ? 'Yes' : 'To be verified',
        monthlyRent: transactionType === 'rent' ? finalPrice : undefined,
        advanceDeposit: transactionType === 'rent' ? Number(depositNumeric) : undefined,
        monthlyMaintenance: transactionType === 'rent' && maintenanceMode === 'additional' ? Number(additionalMaintenance) : 0,
        leasePeriodMonths: transactionType === 'rent' ? leasePeriodMonths : undefined,
        amenities: currentSelectedAmenities,
        locationHighlights: locationHighlights.trim()
          ? locationHighlights.split(',').map(s => s.trim()).filter(Boolean)
          : [
              `Prime location in ${locality || currentCity}`,
              transactionType === 'buy' 
                ? '100% genuine owner direct sale with 0% brokerage'
                : 'Direct owner-to-tenant lease with 0% brokerage & zero middleman fees',
              transactionType === 'buy' 
                ? 'Title deed & 30-Year EC audited' 
                : `Available for: ${preferredTenants} • Handover: ${availableFrom}`
            ],
        images: transactionType === 'buy'
          ? [
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
            ]
          : [
              'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
            ],
        description: transactionType === 'buy'
          ? `Direct owner sale for verified ${activeCategoryObj.title} in ${locality}, ${currentCity}. Zero dealer markups or brokerage.`
          : `Direct rental listing for ${activeCategoryObj.title} in ${locality}, ${currentCity}. Rent: ₹${finalPrice.toLocaleString()}/mo. Zero brokerage.`
      };

      // Persist to backend database via REST API
      const saveEndpoint = initialProperty?.id ? `/api/properties/${initialProperty.id}` : '/api/properties';
      const saveMethod = initialProperty?.id ? 'PUT' : 'POST';
      fetch(saveEndpoint, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListing),
      }).catch(err => console.error('Failed to sync property to DB:', err));

      onListingCreated(newListing);
      setPublishedId(newListing.id);
      setIsPublished(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  if (isPublished) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-2">
            {transactionType === 'buy' ? '✓ Verified Direct-to-Owner Sale Live' : '✓ Verified Direct Landlord Rental Live'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Your Property is Now Live on Trussets!
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Listing ID: <strong className="text-slate-800 font-mono">{publishedId}</strong>. 
            0% Brokerage activated. Genuine {transactionType === 'buy' ? 'buyers' : 'tenants'} will contact you directly via Phone & WhatsApp.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-3 bg-[#77101F] hover:bg-[#600c19] text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              View in Live Feed
            </button>
            <button
              onClick={() => {
                setIsPublished(false);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Post Another Property
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Brand Logo & Headline */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <TrussetsLogo size="lg" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {transactionType === 'buy' 
            ? 'Sell your property easily on Trussets' 
            : 'Rent out your property easily on Trussets'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xl mx-auto">
          {transactionType === 'buy'
            ? 'Upload your Title Deed, EC and clear photos to get verified inquiries from direct buyers. 0% Brokerage.'
            : 'List your home or commercial space for lease. Verified owner identity, 0% brokerage, and zero middleman fees.'}
        </p>
      </div>

      {/* =========================================================================
          KEY REQUIREMENT: SELECTION ABOVE THE 6-STEP UPLOADATION PROCESS
          Toggle between "Sell Property" and "Rent Property"
          The 6-step uploadation process below is directly related to this selection
          ========================================================================= */}
      <div className="mb-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50/70 via-white to-amber-50/60 border-2 border-red-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-[#700B1B] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Step 0: Choose Listing Purpose
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                What would you like to do?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your transaction type below — all 6 steps will instantly adjust to your property choice.
              </p>
            </div>

            {/* Toggle Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
              {/* Sell Property Button */}
              <button
                type="button"
                id="select-sell-property-btn"
                onClick={() => handleIntentChange('buy')}
                className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  transactionType === 'buy'
                    ? 'bg-[#700B1B] text-white shadow-md scale-102'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <Tag className={`w-4 h-4 ${transactionType === 'buy' ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>Sell Property</span>
              </button>

              {/* Rent Property Button */}
              <button
                type="button"
                id="select-rent-property-btn"
                onClick={() => handleIntentChange('rent')}
                className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  transactionType === 'rent'
                    ? 'bg-[#700B1B] text-white shadow-md scale-102'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <KeyRound className={`w-4 h-4 ${transactionType === 'rent' ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>Rent Property</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Card (The 6-Step Uploadation Process) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
        
        {/* Step Indicator Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold tracking-widest text-[#881324] uppercase">
              STEP {currentStep} OF {totalSteps}: {
                currentStep === 1 ? 'PROPERTY CATEGORY' :
                currentStep === 2 ? 'SPECIFICATIONS & DETAILS' :
                currentStep === 3 ? (transactionType === 'buy' ? 'TITLE PROOF & KYC' : 'OWNERSHIP PROOF & KYC') :
                currentStep === 4 ? (transactionType === 'buy' ? 'SELLING PRICE & LOCATION' : 'MONTHLY RENT & DEPOSIT') :
                currentStep === 5 ? (transactionType === 'buy' ? 'INFRASTRUCTURE & AMENITIES' : 'TENANT AMENITIES & CONVENIENCES') :
                'REVIEW & VERIFIED BADGE'
              }
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
              transactionType === 'buy' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
            }`}>
              {transactionType === 'buy' ? '🏷️ For Sale' : '🔑 For Rent'}
            </span>
          </div>

          {/* Stepper Progress Bar & Labels */}
          <div className="hidden sm:flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-100 pb-4">
            <span className={currentStep >= 1 ? 'text-[#881324] font-bold' : ''}>
              1. Category
            </span>
            <span className={currentStep >= 2 ? 'text-[#881324] font-bold' : ''}>
              2. {transactionType === 'buy' ? 'Dimensions' : 'Rental Specs'}
            </span>
            <span className={currentStep >= 3 ? 'text-[#881324] font-bold' : ''}>
              3. {transactionType === 'buy' ? 'Title Deeds' : 'Landlord KYC'}
            </span>
            <span className={currentStep >= 4 ? 'text-[#881324] font-bold' : ''}>
              4. {transactionType === 'buy' ? 'Sale Price' : 'Monthly Rent'}
            </span>
            <span className={currentStep >= 5 ? 'text-[#881324] font-bold' : ''}>
              5. Amenities
            </span>
            <span className={currentStep >= 6 ? 'text-[#881324] font-bold' : ''}>
              6. Review
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-[#881324] h-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* =========================================================================
            STEP 1: SELECT CATEGORY (Related to Sell vs Rent)
            ========================================================================= */}
        {currentStep === 1 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                {transactionType === 'buy' ? 'Select Property Type for Sale' : 'Select Property Type for Rent / Lease'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {transactionType === 'buy'
                  ? 'Choose the category of asset you are selling outright to buyers.'
                  : 'Choose the type of residential or commercial space you want to lease to tenants.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedType === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`wizard-cat-${cat.id}`}
                    onClick={() => setSelectedType(cat.id)}
                    className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-36 cursor-pointer ${
                      isSelected
                        ? 'border-[#881324] ring-2 ring-red-100 bg-red-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#881324]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cat.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hint Box */}
            <div className="mt-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-[#881324] shrink-0" />
              <span>
                Currently configuring upload for <strong>{transactionType === 'buy' ? 'Outright Sale' : 'Rental / Lease'}</strong>. 
                You can toggle between Rent and Sell anytime using the selector above.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: PROPERTY DETAILS & SPECIFICATIONS (Related to Sell vs Rent)
            ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {transactionType === 'buy' ? 'Property Specifications & Dimensions' : 'Rental Property Details & Tenant Preferences'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {transactionType === 'buy'
                  ? 'Provide architectural measurements, facing, and possession status for buyers.'
                  : 'Specify rental unit specifications, preferred tenants, and move-in availability.'}
              </p>
            </div>

            {/* Listing Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Listing Headline / Title</label>
              <input
                type="text"
                placeholder={transactionType === 'buy' 
                  ? "e.g. 4 BHK Triplex Luxury Villa at Kokapet Golden Mile" 
                  : "e.g. Spacious 3 BHK Semi-Furnished Flat with Balcony in Kokapet"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#881324]"
              />
            </div>

            {/* Property Status & Age of Property (Requirements 1, 2, 3, 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-50/40 via-slate-50/60 to-amber-50/30 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Property Status <span className="text-red-500">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {propertyStatus === 'NEW' ? '✓ Brand-New' : '✓ Pre-Owned / Resale'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="property-status-new-btn"
                    onClick={() => {
                      setPropertyStatus('NEW');
                      if (propertyAge === '' || Number(propertyAge) > 2) {
                        setPropertyAge('0');
                      }
                      setPropertyAgeError(null);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      propertyStatus === 'NEW'
                        ? 'bg-[#77101F] text-white border-[#77101F] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>New Property</span>
                  </button>
                  <button
                    type="button"
                    id="property-status-old-btn"
                    onClick={() => {
                      setPropertyStatus('OLD');
                      if (propertyAge === '0' || propertyAge === '') {
                        setPropertyAge('5');
                      }
                      setPropertyAgeError(null);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      propertyStatus === 'OLD'
                        ? 'bg-[#77101F] text-white border-[#77101F] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Old Property</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Age of Property {propertyStatus === 'OLD' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Years)</span>}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={propertyStatus === 'NEW' ? "0" : "5"}
                    value={propertyAge}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== '' && Number(val) < 0) return;
                      setPropertyAge(val);
                      if (propertyAgeError) {
                        validateAge(propertyStatus, val);
                      }
                    }}
                    onBlur={() => validateAge(propertyStatus, propertyAge)}
                    className={`w-full pl-3.5 pr-14 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#77101F] ${
                      propertyAgeError ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    Years
                  </span>
                </div>
                {propertyAgeError ? (
                  <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{propertyAgeError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {propertyStatus === 'NEW'
                      ? 'Enter only number: 0 for brand-new property (displays as 0 Years).'
                      : 'Enter only number: e.g. 5 (displays as 5 Years).'}
                  </p>
                )}
              </div>
            </div>

            {/* Unit Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['villas', 'apartments', 'farmhouses'].includes(selectedType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bedrooms (BHK)</label>
                  <select
                    value={bhk}
                    onChange={(e) => setBhk(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select BHK</option>
                    <option value="1 RK">1 RK (Room Kitchen)</option>
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="2.5 BHK">2.5 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="3.5 BHK">3.5 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="5+ BHK">5+ BHK</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedType === 'plots' ? 'Plot Area (Sq. Yds)' : selectedType === 'lands' ? 'Land Extent (Acres)' : 'Built-up Area (Sq. Ft)'}
                </label>
                <input
                  type="text"
                  placeholder={selectedType === 'lands' ? "e.g. 2.5" : selectedType === 'plots' ? "e.g. 250" : "e.g. 1850"}
                  value={selectedType === 'lands' ? landAcres : selectedType === 'plots' ? landSqYds : areaSqFt}
                  onChange={(e) => {
                    if (selectedType === 'lands') setLandAcres(e.target.value);
                    else if (selectedType === 'plots') setLandSqYds(e.target.value);
                    else setAreaSqFt(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facing Direction</label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Facing Direction</option>
                  <option value="East Facing">East Facing</option>
                  <option value="West Facing">West Facing</option>
                  <option value="North Facing">North Facing</option>
                  <option value="South Facing">South Facing</option>
                  <option value="North-East Facing">North-East (NE) Facing</option>
                  <option value="South-East Facing">South-East (SE) Facing</option>
                  <option value="North-West Facing">North-West (NW) Facing</option>
                  <option value="South-West Facing">South-West (SW) Facing</option>
                </select>
              </div>
            </div>

            {/* RENT SPECIFIC FIELDS vs SELL SPECIFIC FIELDS */}
            {transactionType === 'rent' ? (
              /* Rental specific fields: Floor, Preferred Tenants, Availability, Lock-in */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor & Total Floors</label>
                  <input
                    type="text"
                    value={floorInfo}
                    onChange={(e) => setFloorInfo(e.target.value)}
                    placeholder="e.g. 5th of 14 Floors"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Tenants</label>
                  <select
                    value={preferredTenants}
                    onChange={(e) => setPreferredTenants(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Any (Family/Bachelors)">Any (Family or Bachelors)</option>
                    <option value="Family Only">Family Only</option>
                    <option value="Bachelors Allowed">Bachelors Allowed</option>
                    <option value="Company Lease">Company / Corporate Lease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available For Move-in</label>
                  <select
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Within 15 Days">Within 15 Days</option>
                    <option value="1st of Next Month">1st of Next Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Furnishing Status</label>
                  <select
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Semi-Furnished">Semi-Furnished (Wardrobes, Modular Kitchen)</option>
                    <option value="Fully Furnished">Fully Furnished (Beds, Sofa, TV, AC)</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Lease Period</label>
                  <select
                    value={leasePeriodMonths}
                    onChange={(e) => setLeasePeriodMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value={11}>11 Months (Standard Agreement)</option>
                    <option value={12}>1 Year</option>
                    <option value={24}>2 Years</option>
                    <option value={36}>3+ Years (Commercial)</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Sell specific fields: Road width, Furnishing, Possession status */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approach Road Width (Ft)</label>
                  <input
                    type="number"
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Furnishing Status</label>
                  <select
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Unfurnished">Unfurnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Possession / Status</label>
                  <select
                    value={possession}
                    onChange={(e) => setPossession(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Ready to Move In">Ready to Move In</option>
                    <option value="Ready for Registration">Ready for Registration</option>
                    <option value="Under Construction (2025-2026)">Under Construction (2025-2026)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 3: VERIFICATION & KYC DOCUMENTS (Related to Sell vs Rent)
            ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-[#881324] text-[11px] font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Middleman Integrity Protocol
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {transactionType === 'buy'
                  ? 'Mandatory Title Proofs & Owner KYC Verification'
                  : 'Rental Ownership Proof & Landlord KYC Verification'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {transactionType === 'buy'
                  ? 'To guarantee 0% brokerage and verified titles, upload your Sale Deed copy, 30-Year Nil EC, and Aadhaar/PAN.'
                  : 'To verify legitimate landlord identity and protect tenants from fake listings, verify your ownership via Electricity / Property Tax bill.'}
              </p>
            </div>

            {/* Who is uploading */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Who is Uploading Property?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {transactionType === 'buy' ? (
                  [
                    { id: 'individual' as UploaderType, title: 'Individual Owner', desc: 'Title deed holder / Spouse' },
                    { id: 'builder' as UploaderType, title: 'Builder / Developer', desc: 'Managing Director / Authorized Rep' },
                    { id: 'landlord_poa' as UploaderType, title: 'Power of Attorney (POA)', desc: 'Registered GPA / Joint Venture' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setUploaderType(item.id)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        uploaderType === item.id
                          ? 'border-[#881324] bg-red-50 text-slate-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="block font-bold text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{item.desc}</span>
                    </button>
                  ))
                ) : (
                  [
                    { id: 'individual' as UploaderType, title: 'Property Owner / Landlord', desc: 'Owner of the flat / house' },
                    { id: 'landlord_poa' as UploaderType, title: 'Authorized Family / Caretaker', desc: 'Parent / Son / Daughter' },
                    { id: 'builder' as UploaderType, title: 'Corporate Asset Owner', desc: 'Company owned commercial unit' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setUploaderType(item.id)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        uploaderType === item.id
                          ? 'border-[#881324] bg-red-50 text-slate-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="block font-bold text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{item.desc}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Document Checklist & Mock Uploads - DIFFERENT FOR SELL VS RENT */}
            {transactionType === 'buy' ? (
              /* SELL DOCUMENTS */
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Mandatory Title Proofs (For Sale)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saleDeedUploaded}
                      onChange={(e) => setSaleDeedUploaded(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">Registered Sale Deed / Title Deed</span>
                      <span className="text-[10px] text-slate-400">PDF or Scanned Copy Attached</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ecUploaded}
                      onChange={(e) => setEcUploaded(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">30-Year Encumbrance Certificate (EC - Nil)</span>
                      <span className="text-[10px] text-slate-400">Issued by Registration & Stamps Dept</span>
                    </div>
                  </label>
                </div>

                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-2">
                  2. Government KYC Audit
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kycUploaded}
                      onChange={(e) => setKycUploaded(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">Owner Aadhaar / PAN Verification</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Direct OTP Verified</span>
                    </div>
                  </label>

                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Bank Loan Approval NOC</span>
                    <span className="text-[11px] font-bold text-[#881324]">Available</span>
                  </div>
                </div>
              </div>
            ) : (
              /* RENT DOCUMENTS */
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Ownership Verification (For Rental / Lease)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ownershipProofUploaded}
                      onChange={(e) => setOwnershipProofUploaded(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">Electricity Bill / Property Tax Receipt</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Verified in Owner's Name</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={societyNocUploaded}
                      onChange={(e) => setSocietyNocUploaded(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">Society Maintenance Bill / Key Possession</span>
                      <span className="text-[10px] text-slate-400">Authenticates Direct Landlord access</span>
                    </div>
                  </label>
                </div>

                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-2">
                  2. Landlord Identification & Rental Agreement
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={landlordKycUploaded}
                      onChange={(e) => setLandlordKycUploaded(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">Landlord Aadhaar / Government ID</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Verified for 0% Brokerage</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={standardAgreementDraft}
                      onChange={(e) => setStandardAgreementDraft(e.target.checked)}
                      className="accent-[#881324] w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold block text-slate-800">11-Month Rental Agreement Template</span>
                      <span className="text-[10px] text-[#881324] font-bold">Free e-Stamp Draft Included</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Owner Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {transactionType === 'buy' ? 'Owner Full Legal Name' : 'Landlord Full Legal Name'}
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Direct Phone Number ({transactionType === 'buy' ? 'Buyers call you directly' : 'Tenants call you directly'})
                </label>
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: PRICING & LOCATION (Related to Sell vs Rent)
            ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {transactionType === 'buy' ? 'Selling Price & Geographic Pinning' : 'Monthly Rent, Deposit & Maintenance Terms'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {transactionType === 'buy'
                  ? 'Set your total asking price, negotiable flexibility, and Sub-Registration jurisdiction.'
                  : 'Specify monthly rental expectation, refundable security deposit, and society maintenance.'}
              </p>
            </div>

            {/* PRICING INPUTS: SELL VS RENT */}
            {transactionType === 'buy' ? (
              /* SELL PRICING */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Expected Selling Price (₹)</label>
                  <input
                    type="number"
                    value={sellPriceNumeric}
                    onChange={(e) => setSellPriceNumeric(e.target.value)}
                    placeholder="e.g. 18500000"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#881324]"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Equivalent to: <strong className="text-[#881324]">₹{(Number(sellPriceNumeric) / 10000000).toFixed(2)} Crores</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="negotiable-toggle"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="accent-[#881324] w-5 h-5 cursor-pointer"
                  />
                  <label htmlFor="negotiable-toggle" className="text-xs cursor-pointer">
                    <span className="font-bold text-slate-900 block">Selling Price is Negotiable</span>
                    <span className="text-[10px] text-slate-500">Open to direct discussion with genuine buyers</span>
                  </label>
                </div>
              </div>
            ) : (
              /* RENT PRICING */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expected Monthly Rent (₹/mo)</label>
                    <input
                      type="number"
                      value={monthlyRentNumeric}
                      onChange={(e) => {
                        setMonthlyRentNumeric(e.target.value);
                        // automatically suggest 2 months deposit if default
                        const rentVal = Number(e.target.value) || 0;
                        if (!depositNumeric || depositNumeric === '76000') {
                          setDepositNumeric(String(rentVal * 2));
                        }
                      }}
                      placeholder="e.g. 38000"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-[#881324]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Refundable Security Deposit (₹)</label>
                    <input
                      type="number"
                      value={depositNumeric}
                      onChange={(e) => setDepositNumeric(e.target.value)}
                      placeholder="e.g. 76000"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setDepositNumeric(String((Number(monthlyRentNumeric) || 30000) * 2))}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                      >
                        2 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositNumeric(String((Number(monthlyRentNumeric) || 30000) * 3))}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                      >
                        3 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositNumeric(String((Number(monthlyRentNumeric) || 30000) * 5))}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                      >
                        5 Months
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Society Maintenance</label>
                    <div className="space-y-1.5">
                      <select
                        value={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="included">Included in Monthly Rent</option>
                        <option value="additional">Additional Maintenance (₹/mo)</option>
                      </select>
                      {maintenanceMode === 'additional' && (
                        <input
                          type="number"
                          value={additionalMaintenance}
                          onChange={(e) => setAdditionalMaintenance(e.target.value)}
                          placeholder="e.g. 3500"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="rent-negotiable-toggle"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="accent-[#881324] w-5 h-5 cursor-pointer"
                  />
                  <label htmlFor="rent-negotiable-toggle" className="text-xs cursor-pointer">
                    <span className="font-bold text-slate-900 block">Monthly Rent is Slightly Negotiable</span>
                    <span className="text-[10px] text-slate-500">For long-term reliable tenants with prompt payment history</span>
                  </label>
                </div>
              </div>
            )}

            {/* Geographical details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Locality / Sector</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Kokapet Golden Mile"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District / Jurisdiction</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Ranga Reddy"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {transactionType === 'buy' ? 'Sub-Registration Office (SRO)' : 'Nearest Landmark / Metro'}
                </label>
                <input
                  type="text"
                  value={sroOffice}
                  onChange={(e) => setSroOffice(e.target.value)}
                  placeholder={transactionType === 'buy' ? "e.g. Gandipet SRO" : "e.g. Raidurg Metro Station (5 min)"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Google Map Link & Location Highlights */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#881324]" />
                  <span>Google Maps Property Link (Pin URL)</span>
                </label>
                <input
                  type="url"
                  value={googleMapLink}
                  onChange={(e) => setGoogleMapLink(e.target.value)}
                  placeholder="e.g. https://maps.app.goo.gl/xyz or https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#881324]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Paste the Google Maps link to the exact gate or land boundary so buyers/tenants can navigate directly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Location Highlights</span>
                </label>
                <textarea
                  rows={2}
                  value={locationHighlights}
                  onChange={(e) => setLocationHighlights(e.target.value)}
                  placeholder="e.g. 5 min to Financial District, 500m to Metro Station, Next to Oakridge International School, 15 min to Airport via ORR"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#881324] resize-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Add major landmarks, transit points, tech parks, or schools (separated by commas).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: AMENITIES & INFRASTRUCTURE (Related to Sell vs Rent)
            ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {transactionType === 'buy' ? 'Amenities & Infrastructure Checklist' : 'Tenant Amenities, Appliances & Society Rules'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {transactionType === 'buy'
                  ? 'Check all verified structural infrastructure, community amenities, and parking facilities.'
                  : 'Check all in-unit appliances, furnishings, and society permissions relevant for tenants.'}
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {currentAmenityGroups.map((group) => (
                <div key={group.name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2.5">{group.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const isChecked = currentSelectedAmenities.includes(item);
                      return (
                        <label key={item} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-950">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAmenity(item)}
                            className="accent-[#881324] w-4 h-4 rounded"
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 6: REVIEW & VERIFIED BADGE PREVIEW (Related to Sell vs Rent)
            ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="text-center pb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Protocol Passed</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {transactionType === 'buy' ? 'Sale Listing Review & Direct Badge Preview' : 'Rental Listing Review & Landlord Badge Preview'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {transactionType === 'buy'
                  ? 'Your listing will be published directly to buyers with the official Trussets Verified Deed Badge.'
                  : 'Your rental will be published directly to tenants with 0% brokerage and zero middleman fees.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      transactionType === 'buy' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                    }`}>
                      {transactionType === 'buy' ? '🏷️ For Outright Sale' : '🔑 For Rent / Lease'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {currentCategories.find(c => c.id === selectedType)?.title}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{title || (transactionType === 'buy' ? '4 BHK Luxury Property' : '3 BHK Rental Flat')}</h4>
                  <p className="text-xs text-slate-500">{locality}, {currentCity} • SRO: {sroOffice}</p>
                </div>
                <div className="text-right">
                  {transactionType === 'buy' ? (
                    <>
                      <span className="text-lg sm:text-xl font-black text-[#881324]">
                        ₹{(Number(sellPriceNumeric) / 10000000).toFixed(2)} Cr
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isNegotiable ? 'Negotiable' : 'Fixed Price'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg sm:text-xl font-black text-[#881324]">
                        ₹{Number(monthlyRentNumeric).toLocaleString()}/mo
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Deposit: ₹{Number(depositNumeric).toLocaleString()} • {maintenanceMode === 'included' ? 'Maint. Inc.' : `+₹${additionalMaintenance} Maint.`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Built-up Area</span>
                  <span className="font-bold text-slate-800">{areaSqFt} Sq.Ft</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">
                    {transactionType === 'buy' ? 'Facing' : 'Floor & Facing'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {transactionType === 'buy' ? facing : `${floorInfo} • ${facing}`}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">
                    {transactionType === 'buy' ? 'Title Proof' : 'Landlord Proof'}
                  </span>
                  <span className="font-bold text-emerald-700">
                    {transactionType === 'buy' ? 'Sale Deed Clear' : 'Ownership Verified'}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Brokerage</span>
                  <span className="font-bold text-[#881324]">0% Brokerage</span>
                </div>
              </div>

              {transactionType === 'rent' && (
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tenant Preference</span>
                    <span className="font-bold text-slate-800">{preferredTenants}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Available From</span>
                    <span className="font-bold text-slate-800">{availableFrom}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lease Lock-in</span>
                    <span className="font-bold text-slate-800">{leasePeriodMonths} Months</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Furnishing</span>
                    <span className="font-bold text-slate-800">{furnishing}</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 text-xs text-slate-700 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#881324] shrink-0" />
                <div>
                  <span className="font-bold block text-[#881324]">Trussets Direct Connect Guarantee</span>
                  <span>
                    {transactionType === 'buy'
                      ? 'Buyers contact you directly via phone & WhatsApp. No unsolicited broker calls or commission cuts.'
                      : 'Tenants contact you directly. Zero brokerage fees for you and the tenant.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Bar */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
          <button
            id="wizard-back-btn"
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            id="wizard-next-btn"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>{currentStep === totalSteps ? 'Publish Property' : 'Next'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
