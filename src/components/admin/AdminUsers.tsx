import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { AdminUserListItem } from '../../types/admin';
import { PropertyListing } from '../../types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Building2,
  Clock,
  Check,
  X,
  Plus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface AdminUsersProps {
  initialFilter?: {
    userType?: string;
    verified?: string;
    status?: string;
  };
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ initialFilter }) => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState(initialFilter?.userType || '');
  const [verified, setVerified] = useState(initialFilter?.verified || '');
  const [status, setStatus] = useState(initialFilter?.status || '');
  const [sortBy, setSortBy] = useState('accountCreated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyListing[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserListItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AdminUserListItem>>({});
  const [editError, setEditError] = useState('');
  const [createFormData, setCreateFormData] = useState({
    name: '',
    phone: '',
    email: '',
    userType: 'Property Buyers',
    city: 'Hyderabad',
    location: '',
    status: 'Active' as 'Active' | 'Inactive',
    verified: true,
    planName: 'Free Tier',
  });
  const [createError, setCreateError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin accounts management state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'super_admin',
    department: 'Platform Governance',
    password: '',
  });
  const [adminCreateError, setAdminCreateError] = useState('');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  const fetchAdmins = async () => {
    try {
      const res = await adminApi.getAdmins();
      if (res.staff) {
        setAdminsList(res.staff);
      }
    } catch (e) {
      console.error('Failed fetching admins:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getUsers({
        search,
        userType,
        verified,
        status,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setUsers(res.users);
      setTotal(res.pagination.total);
    } catch (e) {
      console.error('Failed fetching users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdmins();
  }, [search, userType, verified, status, sortBy, sortOrder, page]);

  // View details
  const handleViewUser = async (u: AdminUserListItem) => {
    setSelectedUser(u);
    setIsDetailOpen(true);
    try {
      const res = await adminApi.getUser(u.id);
      setSelectedUser(res.user);
      setUserProperties(res.properties);
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle verify
  const handleToggleVerify = async (u: AdminUserListItem) => {
    try {
      const res = await adminApi.toggleUserVerify(u.id, !u.verified);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? res.user : item)));
      if (selectedUser?.id === u.id) {
        setSelectedUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle status
  const handleToggleStatus = async (u: AdminUserListItem) => {
    try {
      const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
      const res = await adminApi.toggleUserStatus(u.id, newStatus);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? res.user : item)));
      if (selectedUser?.id === u.id) {
        setSelectedUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete user
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(true);
      await adminApi.deleteUser(userToDelete.id);
      setIsDeleteOpen(false);
      setUserToDelete(null);
      if (isDetailOpen) setIsDetailOpen(false);
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit user
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');
    try {
      setActionLoading(true);
      const res = await adminApi.updateUser(selectedUser.id, editFormData);
      setUsers((prev) => prev.map((item) => (item.id === selectedUser.id ? res.user : item)));
      setSelectedUser(res.user);
      setIsEditOpen(false);
    } catch (e: any) {
      console.error(e);
      setEditError(e.message || 'Failed to update user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (u: AdminUserListItem) => {
    setSelectedUser(u);
    setEditError('');
    setEditFormData({
      name: u.name,
      email: u.email,
      phone: u.phone,
      userType: u.userType,
      location: u.location,
      city: u.city,
      state: u.state,
      planName: u.planName,
      status: u.status,
      verified: u.verified,
    });
    setIsEditOpen(true);
  };

  const openCreateModal = () => {
    setCreateFormData({
      name: '',
      phone: '',
      email: '',
      userType: 'Property Buyers',
      city: 'Hyderabad',
      location: '',
      status: 'Active',
      verified: true,
      planName: 'Free Tier',
    });
    setCreateError('');
    setIsCreateOpen(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!createFormData.name.trim() || !createFormData.phone.trim()) {
      setCreateError('Name and mobile number are required.');
      return;
    }
    try {
      setActionLoading(true);
      await adminApi.createUser(createFormData);
      await fetchUsers();
      setIsCreateOpen(false);
    } catch (e: any) {
      console.error(e);
      setCreateError(e.message || 'Failed to create user. Please check mobile number.');
    } finally {
      setActionLoading(false);
    }
  };

  const openAddAdminModal = () => {
    setAdminFormData({
      name: '',
      email: '',
      phone: '',
      role: 'super_admin',
      department: 'Platform Governance',
      password: '',
    });
    setAdminCreateError('');
    setIsAddAdminOpen(true);
  };

  const handleSaveNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateError('');
    if (!adminFormData.name.trim() || !adminFormData.email.trim() || !adminFormData.password.trim()) {
      setAdminCreateError('Full name, email address, and password are required.');
      return;
    }
    if (adminFormData.password.length < 6) {
      setAdminCreateError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setActionLoading(true);
      await adminApi.createAdmin({
        name: adminFormData.name.trim(),
        email: adminFormData.email.trim(),
        phone: adminFormData.phone.trim(),
        role: adminFormData.role,
        department: adminFormData.department.trim() || 'Platform Governance',
        password: adminFormData.password,
      });
      await fetchAdmins();
      await fetchUsers();
      setIsAddAdminOpen(false);
      setAdminSuccessMsg(`New administrator (${adminFormData.email.trim()}) added successfully!`);
      setTimeout(() => setAdminSuccessMsg(''), 4000);
    } catch (e: any) {
      setAdminCreateError(e.message || 'Failed to create admin account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminName: string) => {
    try {
      setActionLoading(true);
      await adminApi.deleteAdmin(adminId);
      await fetchAdmins();
      setAdminSuccessMsg(`Removed administrator ${adminName}.`);
      setTimeout(() => setAdminSuccessMsg(''), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {adminSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {adminSuccessMsg}
          </span>
          <button onClick={() => setAdminSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              User &amp; Admin Management
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-black rounded-full">
              {total} Total Users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of platform administrators, buyers, sellers, property owners, and verified tenants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="admin-open-add-admin-btn"
            onClick={openAddAdminModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Add New Admin
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#77101F] text-white text-xs font-bold rounded-xl hover:bg-[#600c19] transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add User
          </button>
          <button
            onClick={() => {
              setSearch('');
              setUserType('');
              setVerified('');
              setStatus('');
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
          <button
            onClick={() => {
              fetchUsers();
              fetchAdmins();
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Platform Administrators Section */}
      <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Platform Administrators ({adminsList.length})
            </h2>
          </div>
          <button
            onClick={openAddAdminModal}
            className="text-xs font-bold text-[#77101F] hover:underline flex items-center gap-1 cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Admin</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminsList.map((adm) => (
            <div
              key={adm.id}
              className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900 truncate">{adm.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                    {adm.roleTitle || 'Administrator'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">{adm.email}</div>
                {adm.phone && <div className="text-[11px] text-slate-500 mt-0.5">{adm.phone}</div>}
              </div>
              {!adm.isOriginalSuperAdmin && (
                <button
                  onClick={() => handleRemoveAdmin(adm.id, adm.name)}
                  disabled={actionLoading}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove Admin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Name, Email, Phone, Property, Location..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
            />
          </div>

          {/* User Type Filter */}
          <div>
            <select
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">All User Personas</option>
              <option value="Property Sellers">Property Sellers</option>
              <option value="Property Buyers">Property Buyers</option>
              <option value="Tenants">Tenants</option>
              <option value="Property Owners">Property Owners</option>
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <select
              value={verified}
              onChange={(e) => {
                setVerified(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Verification Status (All)</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
          </div>

          {/* Account Status */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">Account Status (All)</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Persona</th>
                <th className="py-3 px-3">Listings / Plan</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Account Date</th>
                <th className="py-3 px-3">Verified</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                    No users matching the selected filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Name & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#77101F] transition-colors">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.phone}</div>
                    </td>

                    {/* Persona Pill */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.userType === 'Property Sellers'
                            ? 'bg-purple-100 text-purple-800'
                            : u.userType === 'Property Buyers'
                            ? 'bg-blue-100 text-blue-800'
                            : u.userType === 'Tenants'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.userType}
                      </span>
                    </td>

                    {/* Listings / Plan */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{u.planName || 'Free Basic'}</div>
                      <div className="text-[10px] text-slate-500">
                        {u.listingsUsed ?? 0} / {u.listingsAllowed ?? 1} Listings
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium truncate max-w-[140px]">{u.location}</div>
                      <div className="text-[10px] text-slate-400">{u.city}</div>
                    </td>

                    {/* Account Date */}
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {u.accountCreated}
                    </td>

                    {/* Verified Toggle */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleVerify(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          u.verified
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle KYC verification"
                      >
                        {u.verified ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700" /> Verified
                          </>
                        ) : (
                          'Unverified'
                        )}
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                        title="Click to toggle status"
                      >
                        {u.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewUser(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="View user details & history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Edit user details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(u);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete user"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, total)} of {total} registered users
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

      {/* User Details Modal */}
      {isDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#77101F] text-white font-black text-sm flex items-center justify-center">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{selectedUser.id}</span>
                    <span>•</span>
                    <span className="font-semibold text-purple-700">{selectedUser.userType}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Tabs / Info */}
            <div className="mt-5 space-y-5">
              {/* Account Information */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Email</span>
                  <div className="font-bold text-slate-800 break-all">{selectedUser.email}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Phone</span>
                  <div className="font-bold text-slate-800">{selectedUser.phone}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Location</span>
                  <div className="font-bold text-slate-800">{selectedUser.location}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Account Created</span>
                  <div className="font-bold text-slate-800">{selectedUser.accountCreated}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">KYC Verification</span>
                  <div>
                    {selectedUser.verified ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold">Unverified</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Account Status</span>
                  <div className="font-bold text-slate-800">{selectedUser.status}</div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px]">
                    Subscription Plan
                  </span>
                  <span className="font-black text-amber-900 text-sm">
                    {selectedUser.planPrice ? `₹${selectedUser.planPrice.toLocaleString('en-IN')}` : 'Free'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400">Plan:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedUser.planName || 'Free Basic'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Listings:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {selectedUser.listingsUsed ?? 0} / {selectedUser.listingsAllowed ?? 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Starts:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedUser.planStartDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Expires:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedUser.planEndDate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Associated Properties */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  User Listings ({userProperties.length})
                </h4>
                {userProperties.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No published properties under this account.</p>
                ) : (
                  <div className="space-y-2">
                    {userProperties.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&auto=format&fit=crop'}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{p.title}</div>
                            <div className="text-[11px] text-slate-500">
                              {p.locality}, {p.city} • {p.priceDisplay}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                          {p.saleDeedVerified ? 'Verified Deed' : 'Pending Deed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History */}
              {selectedUser.payments && selectedUser.payments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Payment Transactions
                  </h4>
                  <div className="space-y-1.5">
                    {selectedUser.payments.map((pmt) => {
                      const base = pmt.amount || 0;
                      const tax = pmt.taxAmount !== undefined ? pmt.taxAmount : Math.round(base * 0.18 * 100) / 100;
                      const grand = pmt.grandTotal !== undefined ? pmt.grandTotal : Math.round((base + tax) * 100) / 100;
                      return (
                        <div
                          key={pmt.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800">{pmt.plan}</div>
                              <div className="text-[10px] text-slate-400">{pmt.transactionId} {pmt.invoiceNumber ? `• ${pmt.invoiceNumber}` : ''} • {pmt.paymentDate}</div>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">{pmt.status}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/70 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Plan Amount</span>
                              <span className="font-semibold text-slate-700">₹{base.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Tax (18% GST)</span>
                              <span className="font-semibold text-amber-700">₹{tax.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">Grand Total</span>
                              <span className="font-bold text-slate-900">₹{grand.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setUserToDelete(selectedUser);
                  setIsDeleteOpen(true);
                }}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                Delete Account
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(selectedUser)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Edit Information
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Edit User Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Persona Type</label>
                  <select
                    value={editFormData.userType || 'Property Sellers'}
                    onChange={(e) => setEditFormData({ ...editFormData, userType: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Property Sellers">Property Sellers</option>
                    <option value="Property Buyers">Property Buyers</option>
                    <option value="Tenants">Tenants</option>
                    <option value="Property Owners">Property Owners</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Details</label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KYC Status</label>
                  <select
                    value={editFormData.verified ? 'true' : 'false'}
                    onChange={(e) => setEditFormData({ ...editFormData, verified: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editFormData.status || 'Active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Add New User</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 9848012345 or +91..."
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Persona Type</label>
                  <select
                    value={createFormData.userType}
                    onChange={(e) => setCreateFormData({ ...createFormData, userType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Property Buyers">Property Buyers</option>
                    <option value="Property Sellers">Property Sellers</option>
                    <option value="Tenants">Tenants</option>
                    <option value="Property Owners">Property Owners</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={createFormData.city}
                    onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Details</label>
                <input
                  type="text"
                  placeholder="e.g. Madhapur, Hitec City"
                  value={createFormData.location}
                  onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KYC Status</label>
                  <select
                    value={createFormData.verified ? 'true' : 'false'}
                    onChange={(e) => setCreateFormData({ ...createFormData, verified: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={createFormData.status}
                    onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Admin Modal */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New Admin</h3>
                  <p className="text-[11px] text-slate-500">Create a new administrator account with portal access</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAdminOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {adminCreateError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{adminCreateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@trussets.in"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+91 98480 12345"
                  value={adminFormData.phone}
                  onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Role</label>
                  <select
                    value={adminFormData.role}
                    onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="super_admin">Super Administrator</option>
                    <option value="operations_admin">Operations Manager</option>
                    <option value="deed_auditor">Deed Verification Specialist</option>
                    <option value="support_staff">Customer Support Lead</option>
                    <option value="content_moderator">Content &amp; Media Moderator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="Platform Governance"
                    value={adminFormData.department}
                    onChange={(e) => setAdminFormData({ ...adminFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#77101F]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Admin...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Delete User Account</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-800">{userToDelete.name}</span> ({userToDelete.email})? This action will remove all associated listings and cannot be undone.
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
