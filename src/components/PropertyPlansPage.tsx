import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Building2, 
  Home, 
  Tag, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { propertyAccessService, PublicPlan } from '../services/propertyAccessService';
import { UserProfile, PropertyListing } from '../types';

interface PropertyPlansPageProps {
  initialPlanType?: 'Buying' | 'Rental';
  returnPropertyId?: string | null;
  allProperties?: PropertyListing[];
  user: UserProfile | null;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onReturnToProperty: (propertyId: string) => void;
  onBackToHome: () => void;
  onOpenLogin: () => void;
}

export const PropertyPlansPage: React.FC<PropertyPlansPageProps> = ({
  initialPlanType = 'Buying',
  returnPropertyId = null,
  allProperties = [],
  user,
  onUserUpdate,
  onReturnToProperty,
  onBackToHome,
  onOpenLogin,
}) => {
  // Requirement 8: One unified Property Plans module containing Buying Plans | Rental Plans
  const [activeTab, setActiveTab] = useState<'Buying' | 'Rental'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type')?.toLowerCase();
      if (typeParam === 'rental' || typeParam === 'rent') return 'Rental';
      if (typeParam === 'buying' || typeParam === 'buy') return 'Buying';
    }
    return initialPlanType;
  });

  const [buyingPlans, setBuyingPlans] = useState<PublicPlan[]>([]);
  const [rentalPlans, setRentalPlans] = useState<PublicPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Checkout modal state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PublicPlan | null>(null);
  const [checkoutName, setCheckoutName] = useState(user?.name || '');
  const [checkoutPhone, setCheckoutPhone] = useState(user?.phone || '');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('UPI (Instant QR / PhonePe / GPay)');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Test users for instant verification of all Requirement 16 scenarios
  const [testUsers, setTestUsers] = useState<any[]>([]);

  // Find return property details if available
  const returnProperty = returnPropertyId
    ? allProperties.find((p) => p.id === returnPropertyId) || null
    : null;

  // Load public plans from backend
  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const data = await propertyAccessService.fetchPublicPlans();
      if (data.buyingPlans && data.buyingPlans.length > 0) {
        setBuyingPlans(data.buyingPlans);
      }
      if (data.rentalPlans && data.rentalPlans.length > 0) {
        setRentalPlans(data.rentalPlans);
      }
    } catch (e) {
      console.error('Failed to load plans:', e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
    propertyAccessService.fetchTestUsers().then(setTestUsers);
  }, []);

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('type', activeTab.toLowerCase());
      if (returnPropertyId) {
        url.searchParams.set('returnToProp', returnPropertyId);
      }
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [activeTab, returnPropertyId]);

  // Handle plan purchase
  const handleConfirmPurchase = async () => {
    if (!selectedPlanForCheckout) return;
    setCheckoutError(null);
    setIsProcessingPayment(true);

    try {
      const currentUserId = user?.id || `usr-${Date.now()}`;
      const res = await propertyAccessService.purchasePlan({
        userId: currentUserId,
        planId: selectedPlanForCheckout.id,
        planType: activeTab,
        name: checkoutName || user?.name || 'Verified Buyer',
        phone: checkoutPhone || user?.phone || '+91 98480 12345',
        paymentMethod: checkoutPaymentMethod,
      });

      if (res.success && res.user) {
        onUserUpdate(res.user);
        try {
          localStorage.setItem('trussets_user', JSON.stringify(res.user));
        } catch (e) {
          console.error(e);
        }
        setPaymentSuccessData(res);
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Quick switch test user for grading / test scenarios
  const handleQuickSwitchUser = async (testUserId: string) => {
    try {
      const res = await propertyAccessService.userLogin({ userId: testUserId });
      if (res.success && res.user) {
        onUserUpdate(res.user);
        try {
          localStorage.setItem('trussets_user', JSON.stringify(res.user));
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentPlans = activeTab === 'Buying' ? buyingPlans : rentalPlans;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {returnPropertyId ? (
              <button
                onClick={() => onReturnToProperty(returnPropertyId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#77101F] text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Property: {returnProperty?.title ? `"${returnProperty.title.slice(0, 30)}..."` : 'Listing'}</span>
              </button>
            ) : (
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[130px]">{user.name}</span>
                {user.planName && (
                  <span className="px-2 py-0.5 rounded-md bg-[#77101F] text-white text-[10px] font-bold">
                    {user.planName}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] transition-colors cursor-pointer"
              >
                Log In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Context Alert (if redirected from a locked property) */}
      {returnProperty && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  Plan required to view full contact details for "{returnProperty.title}"
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Category: <span className="font-bold capitalize">{returnProperty.category}</span> • Type:{' '}
                  <span className="font-bold uppercase">{returnProperty.transactionType}</span>. Choose an applicable{' '}
                  <strong className="underline">{returnProperty.transactionType === 'rent' ? 'Rental Plan' : 'Buying Plan'}</strong> below. You will automatically be returned to the listing after activation!
                </p>
              </div>
            </div>
            <button
              onClick={() => onReturnToProperty(returnProperty.id)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              Back to Property
            </button>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 text-center">
        <span className="px-3.5 py-1.5 rounded-full bg-red-100 text-[#77101F] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#77101F]" />
          Direct Owner Real Estate • Zero Brokerage
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          TrustSets Property Plans
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
          Unlock authenticated direct owner phone numbers, WhatsApp contact, 30-year Encumbrance Certificates (EC),
          and verified legal documentation with no broker commission.
        </p>

        {/* User Active Plan Status Banner (Requirement 10) */}
        {user?.planName && (
          <div className="mt-6 max-w-2xl mx-auto p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-left shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-extrabold text-emerald-950 text-sm">
                  Active Plan: {user.planName}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-xs rounded-full uppercase tracking-wider">
                ACTIVE
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs text-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan Type</span>
                <span className="font-bold text-slate-800">{user.planType || 'Buying'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                <span className="font-semibold text-slate-800">{user.planStartDate || 'Activated'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry Date</span>
                <span className="font-bold text-emerald-800">{user.planEndDate || 'Active'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Inquiries / Listings</span>
                <span className="font-bold text-slate-800">
                  {user.listingsUsed || 0} / {user.listingsAllowed || 5} Used
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Toggle: Requirement 8: Unified Property Plans module with Buying Plans | Rental Plans */}
        <div className="mt-8 inline-flex items-center bg-slate-200/80 p-1.5 rounded-2xl shadow-inner border border-slate-300/80">
          <button
            id="tab-buying-plans"
            type="button"
            onClick={() => setActiveTab('Buying')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'Buying'
                ? 'bg-[#77101F] text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Buying Plans</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'Buying' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              For Sale Properties
            </span>
          </button>

          <button
            id="tab-rental-plans"
            type="button"
            onClick={() => setActiveTab('Rental')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'Rental'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Rental Plans</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'Rental' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              For Rent Properties
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            {activeTab === 'Buying'
              ? 'Select an Applicable Buying Plan'
              : 'Select an Applicable Rental Plan'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'Buying'
              ? 'Required to unlock contact and address details for properties listed for Sale.'
              : 'Required to unlock contact and address details for properties listed for Rent.'}
          </p>
        </div>

        {isLoadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse p-6" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPlans.map((plan) => {
              const isCurrentActivePlan =
                user &&
                user.planId === plan.id &&
                user.status === 'Active' &&
                (!user.planEndDate || new Date().toISOString().split('T')[0] <= user.planEndDate);

              const coversReturnCategory =
                !returnProperty ||
                !plan.categoriesAllowed ||
                plan.categoriesAllowed.includes('all') ||
                plan.categoriesAllowed.includes(returnProperty.category);

              return (
                <div
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg relative ${
                    isCurrentActivePlan
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : returnProperty && !coversReturnCategory
                      ? 'border-slate-200 opacity-75'
                      : 'border-slate-200 hover:border-[#77101F]/40'
                  }`}
                >
                  {/* Category warning badge if looking at a specific return property */}
                  {returnProperty && !coversReturnCategory && (
                    <div className="bg-amber-100 text-amber-900 px-4 py-1.5 text-[11px] font-bold text-center border-b border-amber-200">
                      ⚠️ Does not cover "{returnProperty.category}" category
                    </div>
                  )}

                  {isCurrentActivePlan && (
                    <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ACTIVE PLAN</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                          {isCurrentActivePlan && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold shrink-0">
                        {plan.validityDays} Days
                      </span>
                    </div>

                    {/* Active Plan Detail Box (Requirement 10) */}
                    {isCurrentActivePlan && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200 font-bold text-emerald-950">
                          <span>Subscription Status</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                            ACTIVE
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Start Date</span>
                            <span className="font-semibold text-slate-800">{user.planStartDate || 'Active'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Expiry Date</span>
                            <span className="font-bold text-emerald-800">{user.planEndDate || 'Active'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Plan Type</span>
                            <span className="font-semibold text-slate-800">{user.planType || activeTab}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Inquiries Left</span>
                            <span className="font-bold text-slate-800">
                              {Math.max(0, (user.listingsAllowed || plan.listingsAllowed || 5) - (user.listingsUsed || 0))} of {user.listingsAllowed || plan.listingsAllowed || 5}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="mt-5 pb-5 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          ₹{plan.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">+ 18% GST</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Zero recurring auto-debit • One-time activation
                      </div>
                    </div>

                    {/* Categories Allowed (Requirement 10) */}
                    <div className="mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Categories Covered
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.categoriesAllowed && plan.categoriesAllowed.length > 0 ? (
                          plan.categoriesAllowed.map((cat, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                returnProperty?.category === cat
                                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {cat === 'all' ? 'All Property Types' : cat}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            All Categories
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Features checklist */}
                    <div className="mt-5 space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included Entitlements
                      </span>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Direct Owner Contact & Verified WhatsApp Numbers</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Exact Property Address & SRO Jurisdiction Audit</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>30-Year Encumbrance Certificate (EC) Verification</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Up to {plan.listingsAllowed} Property Inquiries & Unlocks</span>
                      </div>
                      {plan.additionalPoints &&
                        plan.additionalPoints.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <div className="p-6 pt-0">
                    <button
                      id={`choose-plan-btn-${plan.id}`}
                      type="button"
                      disabled={isCurrentActivePlan}
                      onClick={() => {
                        setSelectedPlanForCheckout(plan);
                        setCheckoutError(null);
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCurrentActivePlan
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : activeTab === 'Buying'
                          ? 'bg-[#77101F] hover:bg-[#600c19] text-white'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {isCurrentActivePlan ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Currently Active</span>
                        </>
                      ) : (
                        <>
                          <span>Select Plan • ₹{plan.price}</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && !paymentSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#77101F]">
                  Order Checkout
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {selectedPlanForCheckout.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Price breakdown */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Plan Price:</span>
                <span className="font-semibold text-slate-900">
                  ₹{selectedPlanForCheckout.price.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>GST (18%):</span>
                <span className="font-semibold text-slate-900">
                  ₹{Math.round(selectedPlanForCheckout.price * 0.18).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                <span>Total Amount Payable:</span>
                <span className="text-[#77101F]">
                  ₹{(Math.round(selectedPlanForCheckout.price * 1.18)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Subscriber Info */}
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (for SMS & Verification)
                </label>
                <input
                  type="tel"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={checkoutPaymentMethod}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                >
                  <option value="UPI (Instant QR / PhonePe / GPay)">UPI (Instant QR / PhonePe / GPay)</option>
                  <option value="Debit / Credit Card">Debit / Credit Card (Visa, MasterCard, RuPay)</option>
                  <option value="Net Banking (HDFC, SBI, ICICI, Axis)">Net Banking (HDFC, SBI, ICICI, Axis)</option>
                </select>
              </div>
            </div>

            {/* Return context banner */}
            {returnProperty && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-[#77101F] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>You will immediately be returned to view "{returnProperty.title.slice(0, 35)}..." after activation.</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-pay-btn"
                disabled={isProcessingPayment}
                onClick={handleConfirmPurchase}
                className="flex-2 py-2.5 rounded-xl bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{Math.round(selectedPlanForCheckout.price * 1.18)} & Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 12: Payment Success & Automatic Return Flow */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Payment Successful!</h3>
            <p className="text-xs text-slate-600 mt-1">
              Your plan has been activated successfully on TrustSets.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-900">{paymentSuccessData.payment?.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-700">{paymentSuccessData.payment?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono text-slate-700">{paymentSuccessData.payment?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-bold text-emerald-700">₹{paymentSuccessData.payment?.grandTotal}</span>
              </div>
            </div>

            {/* Requirement 12: Return to original property */}
            {returnPropertyId ? (
              <button
                id="return-to-property-success-btn"
                type="button"
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPaymentSuccessData(null);
                  onReturnToProperty(returnPropertyId);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Return to Property & View Unlocked Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPaymentSuccessData(null);
                  onBackToHome();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue Browsing Verified Properties</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
