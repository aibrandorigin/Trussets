import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../services/adminApi';
import { BuyingPlan, RentalPlan } from '../../types/admin';
import {
  CreditCard,
  Key,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  MoveUp,
  MoveDown,
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminPlansProps {
  initialTab?: 'buying' | 'rental';
  onSubTabChange?: (tab: 'buying' | 'rental') => void;
}

export const AdminPlans: React.FC<AdminPlansProps> = ({
  initialTab = 'buying',
  onSubTabChange,
}) => {
  const [currentTab, setCurrentTab] = useState<'buying' | 'rental'>(initialTab);
  const [buyingPlans, setBuyingPlans] = useState<BuyingPlan[]>([]);
  const [rentalPlans, setRentalPlans] = useState<RentalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<string>('All');
  const [validityFilter, setValidityFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number;
    listingsAllowed: number;
    validityDays: number;
    categoriesAllowed: string[];
    additionalPoints: string[];
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    description: '',
    price: 999,
    listingsAllowed: 3,
    validityDays: 60,
    categoriesAllowed: ['plots', 'apartments', 'villas'],
    additionalPoints: ['Verified Owner Listing', 'Direct WhatsApp Connect'],
    status: 'Active',
  });
  const [newPointInput, setNewPointInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize when initialTab prop updates
  useEffect(() => {
    if (initialTab && initialTab !== currentTab) {
      setCurrentTab(initialTab);
      // Reset filter on external tab change
      setSearchQuery('');
      setStatusFilter('All');
      setCategoryFilter('All');
      setPriceFilter('All');
      setValidityFilter('All');
    }
  }, [initialTab]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const [bRes, rRes] = await Promise.all([adminApi.getBuyingPlans(), adminApi.getRentalPlans()]);
      setBuyingPlans(bRes.plans || []);
      setRentalPlans(rRes.plans || []);
    } catch (e) {
      console.error('Failed fetching plans:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const currentPlans = currentTab === 'buying' ? buyingPlans : rentalPlans;

  // Filtered plans based strictly on the selected tab and active filters
  const filteredPlans = useMemo(() => {
    return currentPlans.filter((plan) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = plan.name.toLowerCase().includes(q);
        const matchesDesc = plan.description.toLowerCase().includes(q);
        const matchesPoints = plan.additionalPoints?.some((pt) => pt.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesPoints) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'All' && plan.status !== statusFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'All') {
        if (!plan.categoriesAllowed || !plan.categoriesAllowed.includes(categoryFilter)) {
          return false;
        }
      }

      // 4. Price filter
      if (priceFilter !== 'All') {
        if (priceFilter === 'under1000' && plan.price >= 1000) return false;
        if (priceFilter === '1000-5000' && (plan.price < 1000 || plan.price > 5000)) return false;
        if (priceFilter === 'above5000' && plan.price <= 5000) return false;
      }

      // 5. Validity filter
      if (validityFilter !== 'All') {
        const valDays = Number(validityFilter);
        if (plan.validityDays !== valDays) return false;
      }

      return true;
    });
  }, [currentPlans, searchQuery, statusFilter, categoryFilter, priceFilter, validityFilter]);

  const isFiltered =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    priceFilter !== 'All' ||
    validityFilter !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriceFilter('All');
    setValidityFilter('All');
  };

  // Tab switch handler
  const handleTabSwitch = (tab: 'buying' | 'rental') => {
    setCurrentTab(tab);
    resetFilters();
    onSubTabChange?.(tab);
  };

  // Move plan up/down (only within the active category)
  const movePlan = async (index: number, direction: 'up' | 'down') => {
    if (isFiltered) return; // Disallow moving while filter active to avoid confusion

    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentPlans.length) return;

    const updated = [...currentPlans];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);

    if (currentTab === 'buying') {
      setBuyingPlans(updated as BuyingPlan[]);
      try {
        await adminApi.reorderBuyingPlans(updated.map((p) => p.id));
      } catch (e) {
        console.error('Failed reordering buying plans:', e);
        fetchPlans();
      }
    } else {
      setRentalPlans(updated as RentalPlan[]);
      try {
        await adminApi.reorderRentalPlans(updated.map((p) => p.id));
      } catch (e) {
        console.error('Failed reordering rental plans:', e);
        fetchPlans();
      }
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPlanId(null);
    setFormData({
      name: '',
      description: '',
      price: currentTab === 'buying' ? 1499 : 799,
      listingsAllowed: currentTab === 'buying' ? 3 : 2,
      validityDays: 60,
      categoriesAllowed: ['plots', 'apartments', 'villas'],
      additionalPoints:
        currentTab === 'buying'
          ? [
              'Direct WhatsApp & Call Connect',
              'Verified Title Deed Seal',
              'Featured Search Placement',
            ]
          : [
              'Verified Tenant Inquiries',
              'Instant Rental Agreement Draft',
              'Featured In Rental Search',
            ],
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (plan: any) => {
    setEditingPlanId(plan.id);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      listingsAllowed: plan.listingsAllowed,
      validityDays: plan.validityDays,
      categoriesAllowed: plan.categoriesAllowed || [],
      additionalPoints: plan.additionalPoints || [],
      status: plan.status,
    });
    setIsModalOpen(true);
  };

  // Duplicate plan
  const handleDuplicate = async (plan: any) => {
    try {
      const duplicatedData = {
        name: `${plan.name} (Copy)`,
        description: plan.description,
        price: plan.price,
        listingsAllowed: plan.listingsAllowed,
        validityDays: plan.validityDays,
        categoriesAllowed: plan.categoriesAllowed || [],
        additionalPoints: [...(plan.additionalPoints || [])],
        status: 'Active' as const,
      };
      if (currentTab === 'buying') {
        await adminApi.createBuyingPlan(duplicatedData);
      } else {
        await adminApi.createRentalPlan(duplicatedData);
      }
      fetchPlans();
    } catch (e) {
      console.error('Failed duplicating plan:', e);
    }
  };

  // Toggle status
  const handleToggleStatus = async (plan: any) => {
    const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
    try {
      if (currentTab === 'buying') {
        await adminApi.updateBuyingPlan(plan.id, { status: newStatus });
      } else {
        await adminApi.updateRentalPlan(plan.id, { status: newStatus });
      }
      fetchPlans();
    } catch (e) {
      console.error('Failed toggling plan status:', e);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      if (currentTab === 'buying') {
        await adminApi.deleteBuyingPlan(planToDelete.id);
      } else {
        await adminApi.deleteRentalPlan(planToDelete.id);
      }
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (e) {
      console.error('Failed deleting plan:', e);
    }
  };

  // Add Point handler
  const handleAddPoint = () => {
    if (!newPointInput.trim()) return;
    setFormData({
      ...formData,
      additionalPoints: [...formData.additionalPoints, newPointInput.trim()],
    });
    setNewPointInput('');
  };

  // Remove point
  const handleRemovePoint = (index: number) => {
    const updated = [...formData.additionalPoints];
    updated.splice(index, 1);
    setFormData({ ...formData, additionalPoints: updated });
  };

  // Toggle Category checkbox
  const handleToggleCategory = (cat: string) => {
    const current = formData.categoriesAllowed || [];
    if (current.includes(cat)) {
      setFormData({
        ...formData,
        categoriesAllowed: current.filter((c: string) => c !== cat),
      });
    } else {
      setFormData({
        ...formData,
        categoriesAllowed: [...current, cat],
      });
    }
  };

  // Save Plan
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingPlanId) {
        if (currentTab === 'buying') {
          await adminApi.updateBuyingPlan(editingPlanId, formData);
        } else {
          await adminApi.updateRentalPlan(editingPlanId, formData);
        }
      } else {
        if (currentTab === 'buying') {
          await adminApi.createBuyingPlan(formData);
        } else {
          await adminApi.createRentalPlan(formData);
        }
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (e) {
      console.error('Failed saving plan:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = ['plots', 'apartments', 'villas', 'commercial', 'agricultural'];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span>Admin</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800">Property Plans</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#77101F] font-bold">
          {currentTab === 'buying' ? 'Buying Plans' : 'Rental Plans'}
        </span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Property Plans
            </h1>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-full tracking-wider">
              {currentTab === 'buying' ? 'Buying Tier' : 'Rental Tier'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure monetization tiers, pricing packages, listing entitlements, and benefit points for{' '}
            {currentTab === 'buying' ? 'property sales' : 'rental properties'}.
          </p>
        </div>

        <button
          id="create-plan-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          title={`Create a new ${currentTab === 'buying' ? 'Buying' : 'Rental'} Plan`}
        >
          <Plus className="w-4 h-4" />
          Create {currentTab === 'buying' ? 'Buying Plan' : 'Rental Plan'}
        </button>
      </div>

      {/* Tab Switch Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          id="plans-tab-buying"
          onClick={() => handleTabSwitch('buying')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'buying'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Buying Plans ({buyingPlans.length})
        </button>
        <button
          id="plans-tab-rental"
          onClick={() => handleTabSwitch('rental')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'rental'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Key className="w-4 h-4" />
          Rental Plans ({rentalPlans.length})
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentTab === 'buying' ? 'buying' : 'rental'} plans by name, benefits, description...`}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none capitalize"
            >
              <option value="All">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="All">All Prices</option>
              <option value="under1000">&lt; ₹1,000</option>
              <option value="1000-5000">₹1,000 - ₹5,000</option>
              <option value="above5000">&gt; ₹5,000</option>
            </select>

            {/* Validity Filter */}
            <select
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none"
            >
              <option value="All">All Validity</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
              <option value="180">180 Days</option>
              <option value="365">365 Days</option>
            </select>

            {/* Reset Filters */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Reset all search filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Counter & Reorder Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredPlans.length}</span> of{' '}
            <span className="font-bold text-slate-800">{currentPlans.length}</span>{' '}
            {currentTab === 'buying' ? 'Buying Plans' : 'Rental Plans'}
            {isFiltered && (
              <span className="ml-1 text-[#77101F] font-semibold">(Filters applied)</span>
            )}
          </div>
          <div>
            {isFiltered ? (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                Reordering disabled while filters are active
              </span>
            ) : (
              <span>Use ▲ / ▼ to reorder plans on the public pricing page (auto-saved)</span>
            )}
          </div>
        </div>
      </div>

      {/* Plans List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
            Loading {currentTab === 'buying' ? 'buying' : 'rental'} plans...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              {currentTab === 'buying' ? <CreditCard className="w-6 h-6" /> : <Key className="w-6 h-6" />}
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {isFiltered
                ? `No matching ${currentTab === 'buying' ? 'buying' : 'rental'} plans found`
                : `No ${currentTab === 'buying' ? 'buying' : 'rental'} plans configured`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isFiltered
                ? 'Try broadening your search query or resetting filters.'
                : `Click "Create ${currentTab === 'buying' ? 'Buying Plan' : 'Rental Plan'}" to establish your first monetization tier.`}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {isFiltered ? (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-[#77101F] hover:bg-[#600c19] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Create {currentTab === 'buying' ? 'Buying Plan' : 'Rental Plan'}
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredPlans.map((plan, index) => {
            // Find master index for reordering
            const masterIndex = currentPlans.findIndex((p) => p.id === plan.id);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 relative overflow-hidden group"
              >
                {/* Order badge & controls */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center">
                      #{masterIndex + 1}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => movePlan(masterIndex, 'up')}
                        disabled={isFiltered || masterIndex === 0}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                        title={isFiltered ? 'Clear filters to reorder' : 'Move Up'}
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePlan(masterIndex, 'down')}
                        disabled={isFiltered || masterIndex === currentPlans.length - 1}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                        title={isFiltered ? 'Clear filters to reorder' : 'Move Down'}
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        plan.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Click to toggle plan status"
                    >
                      {plan.status}
                    </button>
                    <button
                      onClick={() => handleDuplicate(plan)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Duplicate plan"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setPlanToDelete(plan);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Price */}
                <div className="py-3">
                  <h3 className="text-base font-extrabold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{plan.description}</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">/ {plan.validityDays} days</span>
                    )}
                  </div>
                </div>

                {/* Entitlements */}
                <div className="py-3 border-y border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Listings Allowed:</span>
                    <span className="font-bold text-slate-900">{plan.listingsAllowed} Properties</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Validity Duration:</span>
                    <span className="font-bold text-slate-900">{plan.validityDays} Days</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Allowed Categories:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {plan.categoriesAllowed?.map((cat) => (
                        <span
                          key={cat}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold capitalize"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Points checklist */}
                <div className="pt-3 flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Key Benefits & Inclusions ({plan.additionalPoints?.length || 0})
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {plan.additionalPoints?.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingPlanId
                    ? `Edit ${currentTab === 'buying' ? 'Buying' : 'Rental'} Plan`
                    : `Create New ${currentTab === 'buying' ? 'Buying' : 'Rental'} Plan`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentTab === 'buying'
                    ? 'Monetization package for property sellers and developers'
                    : 'Monetization package for landlords and rental brokers'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={
                    currentTab === 'buying'
                      ? 'e.g. Platinum Developer Suite'
                      : 'e.g. Premium Landlord Pro'
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Brief summary of who this plan is tailored for..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Listings Allowed</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.listingsAllowed}
                    onChange={(e) =>
                      setFormData({ ...formData, listingsAllowed: Number(e.target.value) })
                    }
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.validityDays}
                    onChange={(e) =>
                      setFormData({ ...formData, validityDays: Number(e.target.value) })
                    }
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Allowed Property Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => {
                    const isChecked = formData.categoriesAllowed?.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer capitalize ${
                          isChecked
                            ? 'bg-[#77101F] text-white border-[#77101F]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Benefit Bullet Points
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPointInput}
                    onChange={(e) => setNewPointInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPoint();
                      }
                    }}
                    placeholder="e.g. Featured in Top Search Placement"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPoint}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer"
                  >
                    Add Point
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {formData.additionalPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="text-slate-800">{pt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePoint(i)}
                        className="text-slate-400 hover:text-red-600 text-xs font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingPlanId
                    ? `Update ${currentTab === 'buying' ? 'Buying' : 'Rental'} Plan`
                    : `Create ${currentTab === 'buying' ? 'Buying' : 'Rental'} Plan`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Delete {currentTab === 'buying' ? 'Buying' : 'Rental'} Plan
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-bold text-slate-800">{planToDelete.name}</span>? Existing users currently subscribed will maintain their grandfathered validity.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
