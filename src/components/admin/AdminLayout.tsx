import React, { useState, useEffect, useRef } from 'react';
import { TrussetsLogo } from '../TrussetsLogo';
import { adminApi, adminAuthStorage } from '../../services/adminApi';
import { AdminUser, AdminNotification, UIPreferences } from '../../types/admin';
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  CreditCard,
  Key,
  PieChart,
  Image as ImageIcon,
  BookOpen,
  MessageSquare,
  ShieldAlert,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  ShieldCheck,
  Menu,
  X,
  Search,
  ExternalLink,
  ArrowUpDown,
  History,
  CheckCircle2,
  Check,
  AlertTriangle,
  FileText,
  HelpCircle
} from 'lucide-react';
import { AdminProfileModal } from './AdminProfileModal';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'properties'
  | 'analytics'
  | 'plans'
  | 'buyingPlans'
  | 'rentalPlans'
  | 'banners'
  | 'blogs'
  | 'testimonials'
  | 'fraudReports'
  | 'inquiries'
  | 'notifications'
  | 'auditLogs'
  | 'settings';

interface MenuItemConfig {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

const DEFAULT_MENU_ITEMS: MenuItemConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'plans', label: 'Property Plans', icon: CreditCard },
  { id: 'banners', label: 'Banners Management', icon: ImageIcon },
  { id: 'blogs', label: 'Blogs Management', icon: BookOpen },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { id: 'fraudReports', label: 'Fraud Reports', icon: ShieldAlert },
  { id: 'inquiries', label: 'Help Inquiries', icon: HelpCircle },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenProfile?: () => void;
  children: React.ReactNode;
  unreadCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  onNavigateHome,
  onOpenProfile,
  children,
  unreadCount = 0,
}) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(DEFAULT_MENU_ITEMS);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications dropdown state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AdminNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile dropdown & modal state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch admin and preferences on mount
  useEffect(() => {
    const initLayout = async () => {
      try {
        const meRes = await adminApi.getMe();
        setAdmin(meRes.admin);
      } catch (e: any) {
        if (e?.message?.includes('Unauthorized') || e?.message?.includes('session expired')) {
          onLogout();
          return;
        }
        console.error('Failed fetching admin me:', e);
      }

      try {
        const prefRes = await adminApi.getPreferences();
        if (prefRes.preferences?.sidebarOrder?.length) {
          // Normalize legacy buyingPlans / rentalPlans into unified plans
          const normalizedOrder = prefRes.preferences.sidebarOrder
            .map((id: string) => {
              if (id === 'buyingPlans' || id === 'rentalPlans') return 'plans';
              return id;
            })
            .filter((id: string) => id !== 'completeAnalytics');

          // Deduplicate while preserving order
          const uniqueOrderedIds = Array.from(new Set(normalizedOrder));

          const ordered = uniqueOrderedIds
            .map((id) => DEFAULT_MENU_ITEMS.find((m) => m.id === id))
            .filter(Boolean) as MenuItemConfig[];

          // Append any missing items from DEFAULT_MENU_ITEMS
          DEFAULT_MENU_ITEMS.forEach((def) => {
            if (!ordered.some((o) => o.id === def.id)) {
              ordered.push(def);
            }
          });
          setMenuItems(ordered);
        }
      } catch (e: any) {
        if (!e?.message?.includes('Unauthorized')) {
          console.error('Failed fetching preferences:', e);
        }
      }

      try {
        const notifRes = await adminApi.getNotifications();
        setNotificationsList(notifRes.notifications);
      } catch (e: any) {
        if (!e?.message?.includes('Unauthorized')) {
          console.error('Failed fetching notifications:', e);
        }
      }
    };

    initLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await adminApi.globalSearch(searchQuery.trim());
        setSearchResults(res.results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await adminApi.markAllNotificationsRead();
      setNotificationsList(res.notifications);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    try {
      await adminApi.markNotificationRead(notif.id);
      setNotificationsList((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      setIsNotificationsOpen(false);
      if (notif.linkModule && (DEFAULT_MENU_ITEMS.some((m) => m.id === notif.linkModule) || notif.linkModule === 'fraudReports')) {
        onTabChange(notif.linkModule as AdminTab);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reorder functions
  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const updated = [...menuItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setMenuItems(updated);
  };

  const saveMenuOrder = async () => {
    const newOrder = menuItems.map((m) => m.id);
    try {
      await adminApi.savePreferences({ sidebarOrder: newOrder });
      setIsReorderModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger & Page Title (Requirement 15: Page Title | Search | Notifications | Relevant Controls) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            <div className="hidden sm:block pl-2 border-l border-slate-200">
              <h2 className="text-sm font-black text-slate-900 whitespace-nowrap tracking-tight">
                {activeTab === 'overview' && 'Overview Dashboard'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'properties' && 'Properties Directory'}
                {activeTab === 'analytics' && 'Platform Analytics'}
                {activeTab === 'plans' && 'Property Plans'}
                {activeTab === 'buyingPlans' && 'Buying Plans'}
                {activeTab === 'rentalPlans' && 'Rental Plans'}
                {activeTab === 'banners' && 'Banners Management'}
                {activeTab === 'blogs' && 'Blogs Management'}
                {activeTab === 'testimonials' && 'Testimonials'}
                {activeTab === 'fraudReports' && 'Fraud Reports'}
                {activeTab === 'inquiries' && 'Help Center Inquiries'}
                {activeTab === 'notifications' && 'Notifications'}
                {activeTab === 'auditLogs' && 'Audit Logs'}
                {activeTab === 'settings' && 'Platform Settings'}
              </h2>
            </div>
          </div>

          {/* Center: Global Search */}
          <div ref={searchRef} className="relative flex-1 max-w-lg mx-2 hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Global Search (Users, Properties, Blogs, Plans, Fraud Reports)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Dropdown Popover */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 max-h-96 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500">Searching marketplace records...</div>
                ) : searchResults &&
                  (searchResults.users?.length ||
                    searchResults.properties?.length ||
                    searchResults.blogs?.length ||
                    searchResults.plans?.length ||
                    searchResults.reports?.length) ? (
                  <div className="space-y-3">
                    {/* Users Results */}
                    {searchResults.users?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Users</div>
                        {searchResults.users.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onTabChange('users');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800">{u.name}</span>
                            <span className="text-[11px] text-slate-500">{u.email}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Properties Results */}
                    {searchResults.properties?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Properties</div>
                        {searchResults.properties.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onTabChange('properties');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{p.title}</span>
                            <span className="text-[11px] text-emerald-700 font-bold">{p.priceDisplay}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Blogs Results */}
                    {searchResults.blogs?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Blogs</div>
                        {searchResults.blogs.map((b: any) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              onTabChange('blogs');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 truncate">{b.title}</span>
                            <span className="text-[10px] text-slate-400">{b.category}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Property Plans */}
                    {searchResults.plans?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Property Plans</div>
                        {searchResults.plans.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onTabChange('plans');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {p.planType || 'Plan'} • ₹{p.price}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Fraud Reports */}
                    {searchResults.reports?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2">Fraud Reports</div>
                        {searchResults.reports.map((r: any) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              onTabChange('fraudReports');
                              setIsSearchOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-700 rounded-lg flex items-center justify-between text-xs cursor-pointer"
                          >
                            <span className="font-semibold">{r.id}: {r.reportType}</span>
                            <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded-full">{r.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No matching records found across TrustSets.</div>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* View Live Website link */}
            <button
              onClick={onNavigateHome}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Open public marketplace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live Marketplace
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                id="admin-notification-bell"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative cursor-pointer transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Admin Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-md">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#77101F] hover:underline font-bold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notificationsList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No notifications at this time.</div>
                    ) : (
                      notificationsList.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left p-3.5 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer ${
                            !n.isRead ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#77101F]" style={{ opacity: n.isRead ? 0 : 1 }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{n.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.description}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{n.timestamp}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onTabChange('notifications');
                      }}
                      className="text-xs text-[#77101F] font-bold hover:underline cursor-pointer"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Button & Menu (Hidden from header per user preference) */}
            <div ref={profileDropdownRef} className="relative hidden">
              <button
                id="admin-workspace-profile-btn"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="hidden"
                title="Admin Account & Profile"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#77101F] to-[#540B16] text-amber-300 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-black text-slate-800 leading-tight truncate max-w-[110px]">
                    {admin?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] font-bold text-amber-800 leading-none">
                    {admin?.roleTitle || 'Super Administrator'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <div className="text-xs font-black text-slate-900 truncate">{admin?.name || 'Administrator'}</div>
                    <div className="text-[11px] text-slate-500 truncate">{admin?.email || 'admin@trussets.in'}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                      <ShieldCheck className="w-3 h-3 text-amber-700" />
                      {admin?.roleTitle || 'Super Administrator'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      id="admin-view-profile-btn"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (onOpenProfile) {
                          onOpenProfile();
                        } else {
                          setIsProfileModalOpen(true);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#77101F]" />
                      <span>View Profile Details</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onTabChange('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Platform Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onNavigateHome();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                      <span>Live Marketplace</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 z-20 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Menu Items Container */}
          <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {/* Reorder Menu Trigger */}
            {!isSidebarCollapsed && (
              <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Navigation</span>
                <button
                  onClick={() => setIsReorderModalOpen(true)}
                  className="hover:text-slate-700 inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  title="Reorder sidebar menu"
                >
                  <ArrowUpDown className="w-3 h-3" /> Reorder
                </button>
              </div>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'plans' && (activeTab === 'buyingPlans' || activeTab === 'rentalPlans'));
              const isNotif = item.id === 'notifications' && unreadCount > 0;

              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#77101F] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!isSidebarCollapsed && isNotif && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white text-[#77101F]' : 'bg-red-500 text-white'
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-100 space-y-1">
              {/* Audit Logs item */}
              <button
                id="admin-nav-auditLogs"
                onClick={() => onTabChange('auditLogs')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'auditLogs'
                    ? 'bg-[#77101F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={isSidebarCollapsed ? 'Audit Logs' : undefined}
              >
                <History className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Audit Logs</span>}
              </button>

              {/* Settings */}
              <button
                id="admin-nav-settings"
                onClick={() => onTabChange('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#77101F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={isSidebarCollapsed ? 'Settings' : undefined}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Settings</span>}
              </button>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 space-y-1">
            {onOpenProfile && (
              <button
                id="admin-sidebar-profile-btn"
                onClick={onOpenProfile}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0' : ''
                }`}
                title="Open Profile Page"
              >
                <User className="w-4 h-4 shrink-0 text-[#77101F]" />
                {!isSidebarCollapsed && <span>My Profile</span>}
              </button>
            )}
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Log Out</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <TrussetsLogo size="sm" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-3 overflow-y-auto space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'plans' && (activeTab === 'buyingPlans' || activeTab === 'rentalPlans'));
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                        isActive
                          ? 'bg-[#77101F] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <button
                    onClick={() => {
                      onTabChange('auditLogs');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>Audit Logs</span>
                  </button>
                  <button
                    onClick={() => {
                      onTabChange('settings');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenProfile) {
                      onOpenProfile();
                    } else {
                      setIsProfileModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#77101F]" />
                  <span>My Profile Page</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Reorder Sidebar Menu Modal */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-[#77101F]" />
                <h3 className="text-base font-extrabold text-slate-900">Reorder Sidebar Menu</h3>
              </div>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Customize the arrangement of modules in your sidebar. Changes are saved to your admin account in the database.
            </p>

            <div className="space-y-1.5 max-h-80 overflow-y-auto p-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400 text-[10px] w-4">{index + 1}.</span>
                      <Icon className="w-4 h-4 text-slate-600" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveMenuItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveMenuItem(index, 'down')}
                        disabled={index === menuItems.length - 1}
                        className="p-1 rounded-md hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveMenuOrder}
                className="px-5 py-2 bg-[#77101F] text-white rounded-xl text-xs font-bold hover:bg-[#600c19] cursor-pointer"
              >
                Save Menu Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        admin={admin}
        onNavigateHome={onNavigateHome}
        onLogout={onLogout}
        isInWorkspace={true}
      />
    </div>
  );
};
