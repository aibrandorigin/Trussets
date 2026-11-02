import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { PropertyListing } from '../../types';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Calendar,
  IndianRupee,
  ExternalLink,
  Check,
  X,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface AdminPropertiesProps {
  initialFilter?: {
    listingStatus?: string;
    verificationStatus?: string;
  };
}

export const AdminProperties: React.FC<AdminPropertiesProps> = ({ initialFilter }) => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [city, setCity] = useState('');
  const [listingStatus, setListingStatus] = useState(initialFilter?.listingStatus || '');
  const [verificationStatus, setVerificationStatus] = useState(initialFilter?.verificationStatus || '');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [propertyAgeRangeFilter, setPropertyAgeRangeFilter] = useState('');
  const [sortBy, setSortBy] = useState('listedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyListing | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PropertyListing> & { propertyStatus?: string; propertyAge?: number | string | null }>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getProperties({
        search,
        category,
        transactionType,
        city,
        listingStatus,
        verificationStatus,
        propertyStatus: propertyStatusFilter,
        propertyAgeRange: propertyAgeRangeFilter,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setProperties(res.properties);
      setTotal(res.pagination.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [search, category, transactionType, city, listingStatus, verificationStatus, propertyStatusFilter, propertyAgeRangeFilter, sortBy, sortOrder, page]);

  // Verify deed
  const handleVerifyDeed = async (p: PropertyListing, verified: boolean) => {
    try {
      const res = await adminApi.verifyProperty(p.id, verified);
      setProperties((prev) => prev.map((item) => (item.id === p.id ? res.property : item)));
      if (selectedProperty?.id === p.id) {
        setSelectedProperty(res.property);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Change listing status
  const handleChangeStatus = async (p: PropertyListing, newStatus: string) => {
    try {
      const res = await adminApi.updatePropertyStatus(p.id, newStatus);
      setProperties((prev) => prev.map((item) => (item.id === p.id ? res.property : item)));
      if (selectedProperty?.id === p.id) {
        setSelectedProperty(res.property);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      setActionLoading(true);
      await adminApi.deleteProperty(propertyToDelete.id);
      setIsDeleteOpen(false);
      setPropertyToDelete(null);
      if (isDetailOpen) setIsDetailOpen(false);
      fetchProperties();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setEditError(null);

    const status = editFormData.propertyStatus || (selectedProperty.propertyStatus ?? 'NEW');
    const rawAge = editFormData.propertyAge !== undefined ? editFormData.propertyAge : selectedProperty.propertyAge;

    if (status === 'OLD') {
      if (rawAge === '' || rawAge === null || rawAge === undefined || isNaN(Number(rawAge))) {
        setEditError('Age of Property is required for Old Property.');
        return;
      }
    }

    if (rawAge !== '' && rawAge !== null && rawAge !== undefined) {
      const numAge = Number(rawAge);
      if (isNaN(numAge) || numAge < 0) {
        setEditError('Age of property cannot be negative. Minimum value is 0 Years.');
        return;
      }
    }

    try {
      setActionLoading(true);
      const parsedAge = rawAge !== '' && rawAge !== null && rawAge !== undefined ? Number(rawAge) : (status === 'NEW' ? 0 : null);
      const payload = {
        ...editFormData,
        propertyStatus: status,
        propertyAge: parsedAge,
        propertyAgeYears: parsedAge !== null ? parsedAge : undefined,
      };

      const res = await adminApi.updateProperty(selectedProperty.id, payload as any);
      setProperties((prev) => prev.map((item) => (item.id === selectedProperty.id ? res.property : item)));
      setSelectedProperty(res.property);
      setIsEditOpen(false);
    } catch (e: any) {
      console.error(e);
      setEditError(e.message || 'Failed to update property');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (p: PropertyListing) => {
    setSelectedProperty(p);
    setEditError(null);
    setEditFormData({
      title: p.title,
      price: p.price,
      priceDisplay: p.priceDisplay,
      category: p.category,
      locality: p.locality,
      city: p.city,
      state: p.state,
      saleDeedVerified: p.saleDeedVerified,
      propertyStatus: p.propertyStatus || (p.propertyAge === 0 ? 'NEW' : 'OLD'),
      propertyAge: p.propertyAge !== undefined && p.propertyAge !== null ? p.propertyAge : (p.propertyAgeYears !== undefined ? p.propertyAgeYears : 0),
      listingStatus: (p as any).listingStatus || 'Published',
      plan: (p as any).plan || 'Gold Plan',
    });
    setIsEditOpen(true);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Property Inventory Management
            </h1>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-black rounded-full">
              {total} Total Listings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Governed marketplace listings, verified title deeds, and transaction lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearch('');
              setCategory('');
              setTransactionType('');
              setCity('');
              setListingStatus('');
              setVerificationStatus('');
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchProperties}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Title, ID, Locality, City..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="plots">Plots</option>
              <option value="apartments">Apartments</option>
              <option value="villas">Villas</option>
              <option value="independent-houses">Houses</option>
              <option value="commercial">Commercial</option>
              <option value="agricultural-land">Agri Land</option>
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Transaction (All)</option>
              <option value="buy">Buy (Sale)</option>
              <option value="rent">Rent / Lease</option>
            </select>
          </div>

          {/* Property Status Filter */}
          <div>
            <select
              value={propertyStatusFilter}
              onChange={(e) => {
                setPropertyStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Property Status (All)</option>
              <option value="NEW">New Property</option>
              <option value="OLD">Old Property</option>
            </select>
          </div>

          {/* Property Age Range Filter */}
          <div>
            <select
              value={propertyAgeRangeFilter}
              onChange={(e) => {
                setPropertyAgeRangeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Age: All</option>
              <option value="0-1">0–1 Years</option>
              <option value="2-5">2–5 Years</option>
              <option value="6-10">6–10 Years</option>
              <option value="10+">10+ Years</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <select
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Title Deed (All)</option>
              <option value="Verified">Verified Deed</option>
              <option value="Pending">Pending Review</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Listing Status */}
          <div>
            <select
              value={listingStatus}
              onChange={(e) => {
                setListingStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Listing Status (All)</option>
              <option value="Published">Published</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
              <option value="Rented">Rented</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Status / Age</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Listed Date</th>
                <th className="py-3 px-3">Title Deed</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
                    Loading properties...
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                    No properties matching current criteria.
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Thumbnail & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&auto=format&fit=crop'}
                          alt={p.title}
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 max-w-[220px]">
                          <div className="font-bold text-slate-900 group-hover:text-[#77101F] transition-colors truncate">
                            {p.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.id} • {p.plan || 'Gold Plan'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {p.category.replace('-', ' ')}
                      </span>
                    </td>

                    {/* Transaction */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.transactionType === 'rent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {p.transactionType === 'rent' ? 'For Rent' : 'For Sale'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{p.priceDisplay}</div>
                      {p.pricePerSqFt && (
                        <div className="text-[10px] text-slate-400">₹{p.pricePerSqFt}/sq.ft</div>
                      )}
                    </td>

                    {/* Status & Age */}
                    <td className="py-3 px-3">
                      {p.propertyStatus === 'NEW' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Sparkles className="w-2.5 h-2.5" />
                          New ({p.propertyAge !== null && p.propertyAge !== undefined ? `${p.propertyAge}Y` : '0Y'})
                        </span>
                      ) : p.propertyStatus === 'OLD' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock className="w-2.5 h-2.5" />
                          Old ({p.propertyAge !== null && p.propertyAge !== undefined ? `${p.propertyAge} Yrs` : (p.propertyAgeYears !== undefined ? `${p.propertyAgeYears} Yrs` : 'Age N/A')})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Not Specified</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium truncate max-w-[140px]">{p.locality}</div>
                      <div className="text-[10px] text-slate-400">{p.city}</div>
                    </td>

                    {/* Listed Date */}
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {p.listedDate}
                    </td>

                    {/* Title Deed Toggle */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleVerifyDeed(p, !p.saleDeedVerified)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.saleDeedVerified
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to toggle Title Deed verification status"
                      >
                        {p.saleDeedVerified ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-700" /> Deed Verified
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-700" /> Pending Deed
                          </>
                        )}
                      </button>
                    </td>

                    {/* Status Dropdown / Pill */}
                    <td className="py-3 px-3">
                      <select
                        value={p.listingStatus || 'Published'}
                        onChange={(e) => handleChangeStatus(p, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border-0 focus:ring-1 focus:ring-slate-300 ${
                          p.listingStatus === 'Published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.listingStatus === 'Sold'
                            ? 'bg-slate-100 text-slate-700'
                            : p.listingStatus === 'Rented'
                            ? 'bg-blue-50 text-blue-700'
                            : p.listingStatus === 'Suspended'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <option value="Published">Published</option>
                        <option value="Pending">Pending</option>
                        <option value="Sold">Sold</option>
                        <option value="Rented">Rented</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedProperty(p);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="View property details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit property"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPropertyToDelete(p);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing {properties.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total} properties
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      {isDetailOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {selectedProperty.category} • {selectedProperty.transactionType === 'rent' ? 'For Rent' : 'For Sale'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">{selectedProperty.title}</h3>
                <p className="text-xs text-slate-500">{selectedProperty.locality}, {selectedProperty.city}, {selectedProperty.state}</p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Gallery */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {selectedProperty.images?.slice(0, 3).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-xl border border-slate-200"
                />
              ))}
            </div>

            {/* Core Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Price</span>
                <div className="text-base font-black text-slate-900">{selectedProperty.priceDisplay}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Property Status</span>
                <div className="font-bold text-slate-800">
                  {selectedProperty.propertyStatus === 'NEW' ? 'New Property' : selectedProperty.propertyStatus === 'OLD' ? 'Old Property' : 'Not Specified'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Age of Property</span>
                <div className="font-bold text-slate-800">
                  {selectedProperty.propertyAge !== null && selectedProperty.propertyAge !== undefined
                    ? `${selectedProperty.propertyAge} Years`
                    : (selectedProperty.propertyAgeYears !== undefined ? `${selectedProperty.propertyAgeYears} Years` : 'Not Specified')}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Area</span>
                <div className="font-bold text-slate-800">{selectedProperty.size} {selectedProperty.sizeUnit}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Listing Plan</span>
                <div className="font-bold text-slate-800">{selectedProperty.plan || 'Gold Plan'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Title Deed Status</span>
                <div>
                  {selectedProperty.saleDeedVerified ? (
                    <span className="text-emerald-700 font-bold">Verified Title</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Pending Deed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedProperty.description}</p>
            </div>

            {/* Features */}
            {selectedProperty.features && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Amenities & Features</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProperty.features.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setPropertyToDelete(selectedProperty);
                  setIsDeleteOpen(true);
                }}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
              >
                Delete Property
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(selectedProperty)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Edit Property
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {isEditOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Edit Property Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editFormData.price || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditFormData({
                        ...editFormData,
                        price: val,
                        priceDisplay: `₹${val.toLocaleString('en-IN')}`,
                      });
                    }}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price Display</label>
                  <input
                    type="text"
                    value={editFormData.priceDisplay || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, priceDisplay: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                  {editError}
                </div>
              )}

              {/* Property Status & Property Age */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Property Status *</label>
                  <select
                    value={editFormData.propertyStatus || 'NEW'}
                    onChange={(e) => {
                      const newStat = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        propertyStatus: newStat,
                        propertyAge: newStat === 'NEW' ? 0 : (editFormData.propertyAge || 5),
                      });
                      setEditError(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none font-medium"
                  >
                    <option value="NEW">New Property (NEW)</option>
                    <option value="OLD">Old Property (OLD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age of Property {editFormData.propertyStatus === 'OLD' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Years)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editFormData.propertyAge !== undefined && editFormData.propertyAge !== null ? editFormData.propertyAge : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== '' && Number(val) < 0) return;
                        setEditFormData({ ...editFormData, propertyAge: val });
                        setEditError(null);
                      }}
                      placeholder={editFormData.propertyStatus === 'NEW' ? '0' : '5'}
                      className="w-full pl-3.5 pr-14 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      Years
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Locality</label>
                  <input
                    type="text"
                    value={editFormData.locality || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, locality: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title Deed KYC</label>
                  <select
                    value={editFormData.saleDeedVerified ? 'true' : 'false'}
                    onChange={(e) => setEditFormData({ ...editFormData, saleDeedVerified: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="true">Verified Title Deed</option>
                    <option value="false">Pending Deed Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Listing Status</label>
                  <select
                    value={editFormData.listingStatus || 'Published'}
                    onChange={(e) => setEditFormData({ ...editFormData, listingStatus: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Published">Published</option>
                    <option value="Pending">Pending</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Delete Property Listing</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">{propertyToDelete.title}</span>? This listing will be removed from TrustSets public search immediately.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
